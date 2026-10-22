"""Ambilight entry point — drives one or two lights in parallel from screen capture."""

import argparse
import sys
import threading

from config.settings import list_available_lights, load_global_config, load_light_config
from ha.client import HomeAssistantClient
from lights import create_light
from engine.ambilight import AmbilightEngine


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Ambilight — mirror screen colors to your smart lights."
    )
    parser.add_argument(
        "lights",
        nargs="*",
        metavar="light",
        help="One or two light names to run (must match config/lights/<name>.yaml).",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available lights and exit.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    # --list: print available lights and exit
    if args.list:
        available = list_available_lights()
        if available:
            print(f"Available lights: {', '.join(available)}")
        else:
            print("No lights found under config/lights/.")
        return

    # No lights specified: show usage
    if not args.lights:
        available = list_available_lights()
        print(f"Usage: python main.py <light1> [light2]")
        if available:
            print(f"Available lights: {', '.join(available)}")
        sys.exit(1)

    if len(args.lights) > 2:
        print("Error: at most two lights supported.")
        sys.exit(1)

    # Validate requested lights exist as config files
    available = list_available_lights()
    for name in args.lights:
        if name not in available:
            print(
                f"Error: unknown light '{name}'. "
                f"Available lights: {', '.join(available)}"
            )
            sys.exit(1)

    # Load shared configuration
    global_config = load_global_config()
    ha_client = HomeAssistantClient(
        url=global_config["ha"]["url"],
        token=global_config["ha"]["token"],
    )

    # Build light instances
    lights = []
    for name in args.lights:
        light_config = load_light_config(name)
        lights.append((name, create_light(light_config)))

    # Print startup info
    if len(lights) == 1:
        print(f"Running Ambilight with light: {lights[0][0]}")
    else:
        print(
            f"Running Ambilight with {len(lights)} lights in parallel: "
            f"{', '.join(name for name, _ in lights)}"
        )

    # Create engines — one per light, sharing the same HA client
    engines = []
    for _name, light in lights:
        engines.append(AmbilightEngine(ha_client=ha_client, light=light, config=global_config))

    # Start engines (one thread each for parallel execution)
    shutdown_event = threading.Event()
    threads: list[threading.Thread] = []

    for engine in engines:
        t = threading.Thread(
            target=engine.run,
            kwargs={"shutdown_event": shutdown_event},
            daemon=True,
        )
        threads.append(t)

    try:
        for t in threads:
            t.start()

        # Block main thread until all engines finish or Ctrl+C
        for t in threads:
            t.join()
    except KeyboardInterrupt:
        print("\nShutting down — turning off lights...")
        shutdown_event.set()

        # Give threads a moment to finish their current cycle, then force-exit
        for t in threads:
            t.join(timeout=2.0)

        # Best-effort: turn off every light directly via HA
        for _name, light in lights:
            try:
                ha_client.turn_off(light.entity_id, transition=0)
            except Exception:
                pass

        print("Lights off. Goodbye.")


if __name__ == "__main__":
    main()
