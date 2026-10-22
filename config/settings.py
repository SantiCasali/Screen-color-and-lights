"""
Configuration loader for Ambilight project.

Loads global and per-light YAML configs from the config/ directory,
with all paths resolved relative to the project root.
"""

from pathlib import Path

import yaml


def get_project_root() -> Path:
    """Return the project root directory (parent of config/)."""
    return Path(__file__).parent.parent


def load_global_config() -> dict:
    """Load config/global.yaml and return it as a dict.

    Expected keys: HA URL, token, system settings.

    Raises:
        FileNotFoundError: If config/global.yaml does not exist.
        yaml.YAMLError: If the file contains invalid YAML.
    """
    config_path = get_project_root() / "config" / "global.yaml"
    try:
        with open(config_path, encoding="utf-8") as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        raise FileNotFoundError(
            f"Global config not found at {config_path}. "
            "Create it from the example or check your project structure."
        )


def load_light_config(light_name: str) -> dict:
    """Load config/lights/{light_name}.yaml and return it as a dict.

    Expected keys: light entity, capabilities, calibration.

    Args:
        light_name: Name of the light (maps to a YAML filename).

    Raises:
        FileNotFoundError: If the light config file does not exist.
        yaml.YAMLError: If the file contains invalid YAML.
    """
    config_path = get_project_root() / "config" / "lights" / f"{light_name}.yaml"
    try:
        with open(config_path, encoding="utf-8") as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        raise FileNotFoundError(
            f"Light config not found at {config_path}. "
            f"Available lights: {list_available_lights()}"
        )


def list_available_lights() -> list[str]:
    """List all light names available under config/lights/.

    Returns a list of .yaml filenames without the extension.
    Returns an empty list if the directory does not exist.
    """
    lights_dir = get_project_root() / "config" / "lights"
    if not lights_dir.is_dir():
        return []
    return sorted(p.stem for p in lights_dir.glob("*.yaml"))
