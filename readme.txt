Installation:

- Required python packages: mysqlDb, passlib, flup
    - install using `pip install -r requirements.txt`
- Mysql credentials: `cp backend/config.py.example backend/config.py; $EDITOR backend/config.py`
- logs folder permissions
- enable server.fcgi execution

- Mysql must NOT have autocommit on (default is ok)
- If you want, make sure apache doesn't return internal server error as detailed error report
