from flask import Flask, Blueprint
from flask_cors import CORS

from src.controller.cluster_controller import main

def create_app():
    app = Flask(__name__)

    CORS(app)

    app.register_blueprint(main)

    return app

app = create_app()
