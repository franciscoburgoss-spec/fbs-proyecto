import pytest
import os
from backend.database import get_conn, init_db, seed_data

TEST_DB = "./test_fbs.db"


@pytest.fixture(autouse=True)
def setup_db(tmp_path_factory):
    os.environ["FBS_DB_PATH"] = TEST_DB
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    init_db()
    seed_data()
    yield
    # cleanup
    # os.remove(TEST_DB)


@pytest.fixture
def conn():
    with get_conn() as c:
        yield c
