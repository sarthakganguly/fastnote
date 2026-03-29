from marshmallow import Schema, fields, validate

class NoteSchema(Schema):
    # Strip whitespace, require a title, and limit length
    title = fields.String(
        required=True, 
        validate=validate.Length(min=1, max=255, error="Title must be between 1 and 255 characters.")
    )
    
    # Content can be empty, but it must be a string if provided
    content = fields.String(required=True)
    
    # Only allow specific note types to prevent bad data
    type = fields.String(
        required=True, 
        validate=validate.OneOf(
            ["markdown", "excalidraw"], 
            error="Type must be either 'markdown' or 'excalidraw'."
        )
    )

# Instantiate the schema so we can use it in our routes
note_schema = NoteSchema()