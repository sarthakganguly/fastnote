import os
import re
import json
from datetime import datetime
from flask import Flask, Response, render_template, request, redirect, url_for, flash, get_flashed_messages, jsonify
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


# --- Helper function for Tag Parsing ---
def parse_tags_from_string(tag_string):
    """Parses a string from the input form, accepting only '#tag' formats."""
    if not tag_string:
        return ""
    valid_tags = [
        part.strip()[1:]
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
    markdown_content = db.Column(db.Text, nullable=True) # Now nullable
    html_content = db.Column(db.Text, nullable=True) # Now nullable, stores SVG for diagrams
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    tags = db.Column(db.String(200))
    
    # New columns for Excalidraw support
    note_type = db.Column(db.String(20), nullable=False, default='markdown')
    excalidraw_json = db.Column(db.Text, nullable=True)

    def to_dict(self):
        """Converts note object to a dictionary for the list view API."""
        return {
            'id': self.id,
            'title': self.title,
            'tags': self.tags,
            'note_type': self.note_type # Essential for the frontend to know how to render
        }

# --- User Session Management ---
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- Authentication & Main Routes (Unchanged) ---
@app.route('/signup', methods=['GET', 'POST'])
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

@app.route('/')
@login_required
def index():
    # This route now just serves the main page. All data is fetched by JavaScript.
    return render_template('index.html')


# --- UNIFIED NOTES API ---

@app.route('/api/note', methods=['POST'])
@login_required
def create_note():
    """Creates a new note or diagram from a JSON payload."""
    data = request.get_json()
    note_type = data.get('note_type', 'markdown')
    tags_str = data.get('tags', '')
    cleaned_tags = parse_tags_from_string(tags_str)

    new_note = Note(
        title=f"{datetime.now().strftime('%Y-%m-%d')}-{cleaned_tags}",
        user_id=current_user.id,
        tags=cleaned_tags,
        note_type=note_type
    )

    if note_type == 'excalidraw':
        new_note.excalidraw_json = data.get('excalidraw_json')
        new_note.html_content = data.get('svg_content') # Store SVG in html_content
    else: # Default to markdown
        content = data.get('content', '')
        new_note.markdown_content = content
        new_note.html_content = markdown2.markdown(content)

    db.session.add(new_note)
    db.session.commit()
    return jsonify(new_note.to_dict()), 201

@app.route('/api/note/<int:note_id>', methods=['PUT'])
@login_required
def update_note(note_id):
    """Updates an existing note or diagram."""
    note = Note.query.get_or_404(note_id)
    if note.author != current_user: return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    tags_str = data.get('tags', '')
    cleaned_tags = parse_tags_from_string(tags_str)

    note.tags = cleaned_tags
    note.title = f"{note.created_at.strftime('%Y-%m-%d')}-{cleaned_tags}"
    
    if note.note_type == 'excalidraw':
        note.excalidraw_json = data.get('excalidraw_json')
        note.html_content = data.get('svg_content')
    else:
        content = data.get('content', '')
        note.markdown_content = content
        note.html_content = markdown2.markdown(content)
        
    db.session.commit()
    return jsonify(note.to_dict())

@app.route('/api/note/<int:note_id>', methods=['GET'])
@login_required
def get_note_details(note_id):
    """Gets the full details of a single note for viewing or editing."""
    note = Note.query.get_or_404(note_id)
    if note.author != current_user: return jsonify({"error": "Unauthorized"}), 403
    
    return jsonify({
        'id': note.id,
        'note_type': note.note_type,
        'tags': note.tags,
        'markdown_content': note.markdown_content,
        'html_content': note.html_content,
        'excalidraw_json': note.excalidraw_json
    })

@app.route('/api/note/<int:note_id>', methods=['DELETE'])
@login_required
def delete_note_api(note_id):
    """Deletes a note."""
    note = Note.query.get_or_404(note_id)
    if note.author != current_user: return jsonify({"error": "Unauthorized"}), 403
    db.session.delete(note)
    db.session.commit()
    return jsonify({"success": True})
    
# --- Search, Download, and Tags API ---

@app.route('/api/search')
@login_required
def search_notes():
    query_str = request.args.get('q', '')
    base_query = Note.query.filter_by(user_id=current_user.id)
    tags_and = [t.strip() for t in re.findall(r'#(\w+)', query_str)]
    or_groups = re.findall(r'OR\((.*?)\)', query_str)
    text_query_str = re.sub(r'#\w+|OR\(.*?\)', '', query_str).strip(' ,')
    filters = []
    if text_query_str: filters.append(Note.markdown_content.like(f"%{text_query_str}%"))
    for tag in tags_and: filters.append(Note.tags.like(f"%{tag}%"))
    if or_groups:
        for group in or_groups:
            or_tags = [t.strip().replace('#', '') for t in group.split(',')]
            filters.append(or_(*[Note.tags.like(f"%{t}%") for t in or_tags]))
    final_query = base_query.filter(and_(*filters)) if filters else base_query
    return jsonify([note.to_dict() for note in final_query.order_by(Note.created_at.desc()).all()])

@app.route('/api/download')
@login_required
def download_notes():
    """Exports all of the user's notes to a single JSON file."""
    notes = Note.query.filter_by(user_id=current_user.id).order_by(Note.created_at.asc()).all()
    notes_for_export = []
    for note in notes:
        content = ""
        if note.note_type == 'excalidraw':
            content = note.html_content # The SVG content
        else:
            content = note.markdown_content

        notes_for_export.append({
            "noteCreatedDate": note.created_at.isoformat(),
            "noteUpdatedDate": note.updated_at.isoformat(),
            "noteContent": content,
            "noteTags": note.tags.split(',') if note.tags else []
        })
        
    response_json = json.dumps(notes_for_export, indent=2)
    return Response(response_json, mimetype='application/json', headers={'Content-Disposition': 'attachment;filename=fastnote_export.json'})

@app.route('/api/tags')
@login_required
def get_all_tags():
    notes = Note.query.filter_by(user_id=current_user.id).all()
    all_tags = set()
    for note in notes:
        if note.tags: all_tags.update([t.strip() for t in note.tags.split(',')])
    return jsonify(sorted(list(all_tags)))

# --- Database Initialization Command ---
@app.cli.command("init-db")
def init_db_command():
    if not os.path.exists(instance_path):
        os.makedirs(instance_path)
    db.create_all()
    print("Database tables created successfully.")