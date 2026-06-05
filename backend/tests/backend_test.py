"""
ARKETYPE Backend Tests
Covers: root, contact, newsletter, projects, auth (login/me/logout/refresh),
brute-force, admin CRUD (projects/contacts/newsletter).
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://creative-works-139.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@arketype.studio"
ADMIN_PASSWORD = "arketype-admin-2026"


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_session():
    """Authenticated session via cookies + Bearer fallback."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code == 429:
        # Locked from brute-force test - wait and retry would take 15 min; skip
        pytest.skip("Admin locked from brute force; rerun later")
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    token = r.json().get("access_token")
    assert token
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


# ---------------- Public ----------------
class TestPublic:
    def test_root_alive(self, http):
        r = http.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "alive"
        assert data["app"] == "ARKETYPE"

    def test_contact_submit(self, http):
        payload = {
            "name": "TEST_User",
            "email": "test_user@example.com",
            "message": "TEST hello from automated tests",
        }
        r = http.post(f"{API}/contact", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert "id" in d and isinstance(d["id"], str)

    def test_contact_invalid_email_422(self, http):
        r = http.post(f"{API}/contact", json={"name": "x", "email": "not-an-email", "message": "x"})
        assert r.status_code == 422

    def test_newsletter_subscribe(self, http):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        r = http.post(f"{API}/newsletter", json={"email": email})
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_newsletter_duplicate_idempotent(self, http):
        email = f"test_dup_{uuid.uuid4().hex[:8]}@example.com"
        r1 = http.post(f"{API}/newsletter", json={"email": email})
        r2 = http.post(f"{API}/newsletter", json={"email": email})
        assert r1.status_code == 200 and r2.status_code == 200
        assert r2.json().get("already_subscribed") is True

    def test_projects_seeded(self, http):
        r = http.get(f"{API}/projects")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        titles = {p["title"] for p in data}
        expected = {"ECHO/FORM", "VOID/RITUAL", "PULSE/CODEX", "MIRROR/ENGINE", "GHOST/CIRCUIT", "CINDER/PROOF"}
        assert expected.issubset(titles), f"Missing seeded projects: {expected - titles}"
        # Ensure no _id leaks
        for p in data:
            assert "_id" not in p


# ---------------- Auth ----------------
class TestAuth:
    def test_login_success_sets_cookies(self, http):
        # Use unique IP-tied identifier by hitting fresh session
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        if r.status_code == 429:
            pytest.skip("Locked from brute force test")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert "access_token" in data
        # cookies set
        cookie_names = {c.name for c in s.cookies}
        assert "access_token" in cookie_names
        assert "refresh_token" in cookie_names

    def test_me_with_bearer(self, admin_session):
        r = admin_session.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_me_unauthenticated_401(self, http):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_refresh_token(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        if r.status_code == 429:
            pytest.skip("Locked")
        assert r.status_code == 200
        r2 = s.post(f"{API}/auth/refresh")
        assert r2.status_code == 200
        assert r2.json()["ok"] is True

    def test_logout_clears_cookies(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        if r.status_code == 429:
            pytest.skip("Locked")
        assert r.status_code == 200
        r2 = s.post(f"{API}/auth/logout")
        assert r2.status_code == 200
        # After logout, /me with same session (no cookies) should be 401
        r3 = s.get(f"{API}/auth/me")
        assert r3.status_code == 401


# ---------------- Brute force (run last) ----------------
class TestBruteForce:
    def test_wrong_password_then_lockout(self):
        # Use unique email so admin lockout doesn't block other tests
        bad_email = f"bf_test_{uuid.uuid4().hex[:8]}@example.com"
        s = requests.Session()
        statuses = []
        for _ in range(6):
            r = s.post(f"{API}/auth/login", json={"email": bad_email, "password": "wrong"})
            statuses.append(r.status_code)
        # First 5 should be 401, then 429
        assert statuses[0] == 401
        assert 429 in statuses, f"Expected 429 lockout, got {statuses}"


# ---------------- Admin protection ----------------
class TestAdminAuth:
    def test_admin_contacts_unauth_401(self):
        r = requests.get(f"{API}/admin/contacts")
        assert r.status_code == 401

    def test_admin_newsletter_unauth_401(self):
        r = requests.get(f"{API}/admin/newsletter")
        assert r.status_code == 401

    def test_admin_projects_unauth_401(self):
        r = requests.get(f"{API}/admin/projects")
        assert r.status_code == 401

    def test_admin_contacts_authed(self, admin_session):
        r = admin_session.get(f"{API}/admin/contacts")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_newsletter_authed(self, admin_session):
        r = admin_session.get(f"{API}/admin/newsletter")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_projects_authed(self, admin_session):
        r = admin_session.get(f"{API}/admin/projects")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------------- Admin CRUD ----------------
class TestAdminProjectCRUD:
    def test_create_update_delete_project(self, admin_session):
        # CREATE
        payload = {
            "title": "TEST/CRUD",
            "client": "TEST Client",
            "year": "2026",
            "category": "TEST",
            "description": "test project",
            "image_url": "https://example.com/x.png",
            "accent_color": "#FF3D00",
            "services": ["A", "B"],
            "published": True,
            "order": 99,
        }
        r = admin_session.post(f"{API}/admin/projects", json=payload)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["title"] == "TEST/CRUD"
        pid = created["id"]

        # GET (verify persisted)
        r2 = admin_session.get(f"{API}/admin/projects")
        assert any(p["id"] == pid for p in r2.json())

        # UPDATE
        payload["title"] = "TEST/CRUD-UPDATED"
        r3 = admin_session.put(f"{API}/admin/projects/{pid}", json=payload)
        assert r3.status_code == 200
        assert r3.json()["title"] == "TEST/CRUD-UPDATED"

        # DELETE
        r4 = admin_session.delete(f"{API}/admin/projects/{pid}")
        assert r4.status_code == 200
        # confirm removed
        r5 = admin_session.get(f"{API}/admin/projects")
        assert not any(p["id"] == pid for p in r5.json())


class TestAdminContactOps:
    def test_mark_read_and_delete(self, admin_session, http):
        # create a contact
        email = f"test_contact_{uuid.uuid4().hex[:6]}@example.com"
        r = http.post(f"{API}/contact", json={"name": "TEST_Mark", "email": email, "message": "to delete"})
        assert r.status_code == 200
        cid = r.json()["id"]

        # mark read
        r2 = admin_session.patch(f"{API}/admin/contacts/{cid}/read")
        assert r2.status_code == 200

        # verify read flag
        listing = admin_session.get(f"{API}/admin/contacts").json()
        match = [c for c in listing if c["id"] == cid]
        assert match and match[0]["read"] is True

        # delete
        r3 = admin_session.delete(f"{API}/admin/contacts/{cid}")
        assert r3.status_code == 200
        listing2 = admin_session.get(f"{API}/admin/contacts").json()
        assert not any(c["id"] == cid for c in listing2)
