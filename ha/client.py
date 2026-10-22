import requests


class HomeAssistantClient:
    """Minimal Home Assistant REST API client for light control."""

    def __init__(self, url: str, token: str):
        self.url = url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    def turn_on(self, entity_id: str, **kwargs):
        payload = {"entity_id": entity_id, **kwargs}
        response = requests.post(
            f"{self.url}/api/services/light/turn_on",
            headers=self.headers,
            json=payload,
        )
        if response.status_code != 200:
            print(f"Error turning on {entity_id}: {response.status_code} {response.text}")

    def turn_off(self, entity_id: str, transition: int = 0):
        payload = {"entity_id": entity_id, "transition": transition}
        response = requests.post(
            f"{self.url}/api/services/light/turn_off",
            headers=self.headers,
            json=payload,
        )
        if response.status_code != 200:
            print(f"Error turning off {entity_id}: {response.status_code} {response.text}")
