import os
import re
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, get_flashed_messages, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import markdown2
from sqlalchemy import and_, or_

# --- Database Path Configuration ---
instance_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'instance'))

# --- App Initialization ---
app = Flask(__name__)
app.config['SECRET_KEY'] = 'a_very_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(instance_path, "app.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'


# --- NEW: Helper function to parse tags correctly ---
def parse_tags_from_string(tag_string):
    """
    Parses a string from the input form.
    Only words prefixed with '#' are considered tags.
    Returns a clean, comma-separated string of valid tags.
    Example: '#life, project, #work' -> 'life,work'
    """
    if not tag_string:
        return ""
    
    # Split by comma and process each part
    valid_tags = [
        part.strip()[1:]  # Remove '#' and surrounding whitespace
        for part in tag_string.split(',')
        if part.strip().startswith('#') and len(part.strip()) > 1
    ]
    
    return ','.join(valid_tags)


# --- Database Models ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    notes = db.relationship('Note', backref='author', lazy=True)

class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    markdown_content = db.Column(db.Text, nullable=False)
    html_content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    tags = db.Column(db.String(200))

    def to_dict(self):
        return {'id': self.id, 'title': self.title, 'tags': self.tags}

# --- User Session Management ---
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- Authentication Routes ---
@app.route('/signup', methods=['GET', 'POST'])
# ... (This route is unchanged)
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user:
            flash('Username already exists.')
            return redirect(url_for('signup'))
        new_user = User(username=username, password=generate_password_hash(password, method='pbkdf2:sha256'))
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('signup.html')


@app.route('/login', methods=['GET', 'POST'])
# ... (This route is unchanged)
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if not user or not check_password_hash(user.password, password):
            flash('Please check your login details and try again.')
            return redirect(url_for('login'))
        login_user(user)
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# --- Main Application Routes ---
@app.route('/')
@login_required
def index():
    notes = Note.query.filter_by(user_id=current_user.id).order_by(Note.created_at.desc()).all()
    return render_template('index.html', notes=notes)

# --- Note CRUD API ---

@app.route('/new_note', methods=['POST'])
@login_required
def new_note():
    tags_str = request.form.get('tags', '').strip()
    content = request.form.get('content')
    
    # UPDATED: Use the new helper function to parse tags
    cleaned_tags = parse_tags_from_string(tags_str)
    
    title = f"{datetime.now().strftime('%Y-%m-%d')}-{cleaned_tags}"
    html_content = markdown2.markdown(content)
    
    note = Note(title=title, markdown_content=content, html_content=html_content, user_id=current_user.id, tags=cleaned_tags)
    db.session.add(note)
    db.session.commit()
    
    return redirect(url_for('index'))

@app.route('/edit_note/<int:note_id>', methods=['POST'])
@login_required
def edit_note(note_id):
    note = Note.query.get_or_404(note_id)
    if note.author != current_user:
        return "Unauthorized", 403

    tags_str = request.form.get('tags', '').strip()
    content = request.form.get('content')

    # UPDATED: Use the new helper function here as well
    cleaned_tags = parse_tags_from_string(tags_str)

    note.title = f"{note.created_at.strftime('%Y-%m-%d')}-{cleaned_tags}"
    note.tags = cleaned_tags
    note.markdown_content = content
    note.html_content = markdown2.markdown(content)
    
    db.session.commit()
    return redirect(url_for('index'))

# ... (The rest of the file: get_note, delete_note, search, etc. are unchanged)
@app.route('/note/<int:note_id>')
@login_required
def get_note(note_id):
    note = Note.query.get_or_404(note_id)
    if note.author != current_user:
        return jsonify({"error": "Unauthorized"}), 403
    return jsonify({
        'html_content': note.html_content, 
        'markdown_content': note.markdown_content, 
        'tags': note.tags
    })

@app.route('/delete_note/<int:note_id>', methods=['DELETE'])
@login_required
def delete_note(note_id):
    note = Note.query.get_or_404(note_id)
    if note.author != current_user:
        return jsonify({"error": "Unauthorized"}), 403
    db.session.delete(note)
    db.session.commit()
    return jsonify({"success": True, "message": "Note deleted"})

@app.route('/api/search')
@login_required
def search_notes():
    query_str = request.args.get('q', '')
    base_query = Note.query.filter_by(user_id=current_user.id)
    
    tags_and = [t.strip() for t in re.findall(r'#(\w+)', query_str)]
    or_groups = re.findall(r'OR\((.*?)\)', query_str)
    
    text_query_str = re.sub(r'#\w+', '', query_str)
    text_query_str = re.sub(r'OR\(.*?\)', '', text_query_str).strip(' ,')
    
    filters = []
    
    if text_query_str:
        filters.append(Note.markdown_content.like(f"%{text_query_str}%"))
    
    for tag in tags_and:
        filters.append(Note.tags.like(f"%{tag}%"))
    
    if or_groups:
        for group in or_groups:
            or_tags = [t.strip().replace('#', '') for t in group.split(',')]
            or_filters = [Note.tags.like(f"%{t}%") for t in or_tags]
            filters.append(or_(*or_filters))
            
    if filters:
        final_query = base_query.filter(and_(*filters))
    else:
        final_query = base_query

    notes = final_query.order_by(Note.created_at.desc()).all()
    return jsonify([note.to_dict() for note in notes])

@app.route('/api/tags')
@login_required
def get_all_tags():
    notes = Note.query.filter_by(user_id=current_user.id).all()
    all_tags = set()
    for note in notes:
        if note.tags:
            all_tags.update([t.strip() for t in note.tags.split(',')])
    return jsonify(sorted(list(all_tags)))

@app.cli.command("init-db")
def init_db_command():
    if not os.path.exists(instance_path):
        os.makedirs(instance_path)
    db.create_all()
    print("Database tables created successfully.")