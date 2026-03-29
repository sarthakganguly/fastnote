from marshmallow import Schema, fields, validate

class NoteSchema(Schema):
    # Strip whitespace, require a title, and limit length
    title = fields.String(
        required=True, 
        validate=validate.Length(min=1, max=255, error="Title must be between 1 and 255 characters.")
    )
    
    # CHANGED: Make content optional. If the frontend doesn't send it, default to an empty string.
    content = fields.String(load_default="")
    
    # Only allow specific note types to prevent bad data
    type = fields.String(
        required=True, 
        validate=validate.OneOf(
            ["markdown", "excalidraw"], 
            error="Type must be either 'markdown' or 'excalidraw'."
        )
    )

note_schema = NoteSchema()