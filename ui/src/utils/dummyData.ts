export const dummyGraphData = {
    "Nodes": [
        { "ID": "photo-gallery-python-flask/definition.py", "Label": "definition" },
        { "ID": "photo-gallery-python-flask/modules/Login.py", "Label": "Login" },
        { "ID": "photo-gallery-python-flask/main.py", "Label": "main" },
        { "ID": "photo-gallery-python-flask/modules/Gallery.py", "Label": "Gallery" },
        { "ID": "photo-gallery-python-flask/modules/Photos.py", "Label": "Photos" }
    ],
    "Edges": [
        { "Source": "photo-gallery-python-flask/modules/Login.py", "Target": "photo-gallery-python-flask/definition.py" },
        { "Source": "photo-gallery-python-flask/main.py", "Target": "photo-gallery-python-flask/definition.py" },
        { "Source": "photo-gallery-python-flask/modules/Gallery.py", "Target": "photo-gallery-python-flask/definition.py" },
        { "Source": "photo-gallery-python-flask/modules/Photos.py", "Target": "photo-gallery-python-flask/definition.py" }
    ]
};
