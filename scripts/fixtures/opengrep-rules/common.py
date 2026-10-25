import os
import pickle
import subprocess
import tempfile
import yaml
import requests
import ssl


def shell(user, cmd):
    # ruleid: py-shell-with-built-command
    subprocess.run(f"ls {user}", shell=True)
    # ruleid: py-shell-with-built-command
    subprocess.check_output(cmd, shell=True)
    # ruleid: py-shell-with-built-command
    os.system("rm -rf " + user)
    # ok: py-shell-with-built-command
    subprocess.run(["ls", user])
    # ok: py-shell-with-built-command
    subprocess.run("ls -l", shell=True)
    # ok: py-shell-with-built-command
    os.system("make build")


def load(blob, text):
    # ruleid: py-unsafe-deserialize
    pickle.loads(blob)
    # ruleid: py-unsafe-deserialize
    yaml.load(text)
    # ok: py-unsafe-deserialize
    yaml.load(text, Loader=yaml.SafeLoader)
    # ok: py-unsafe-deserialize
    yaml.safe_load(text)


def run(expr, name):
    # ruleid: py-eval-exec-built-code
    eval(expr)
    # ruleid: py-eval-exec-built-code
    exec("print(" + name + ")")
    # ok: py-eval-exec-built-code
    eval("1 + 1")


class Repo:
    _table = "t"

    def q(self, cur, name, ids):
        # ruleid: py-db-execute-built-string
        cur.execute(f"SELECT 1 FROM t WHERE n = '{name}'")
        # ruleid: py-db-execute-built-string
        cur.execute("SELECT 1 FROM t WHERE n = '%s'" % name)
        # ruleid: py-db-execute-built-string
        cur.execute("SELECT 1 FROM t WHERE n = '" + name + "'")
        # ok: py-db-execute-built-string
        cur.execute("SELECT 1 FROM t WHERE n = %s", (name,))
        # ok: py-db-execute-built-string
        cur.execute("SELECT 1 FROM t WHERE id IN %s", (tuple(ids),))
        # ok: py-db-execute-built-string
        cur.execute("SELECT id FROM %s" % self._table)
        # ruleid: py-db-execute-built-string
        Model.objects.raw(f"SELECT * FROM t WHERE n = '{name}'")
        # ruleid: py-db-execute-built-string
        session.execute(text(f"SELECT * FROM t WHERE n = '{name}'"))
        # ok: py-db-execute-built-string
        Model.objects.raw("SELECT * FROM t WHERE n = %s", [name])
        placeholders = ",".join(["%s"] * len(ids))
        # ok: py-db-execute-built-string
        cur.execute(f"SELECT 1 FROM t WHERE id IN ({placeholders})", ids)
        # ruleid: py-db-execute-built-string
        cur.execute(f"SELECT 1 FROM t WHERE id IN ({placeholders}) AND n = '{name}'", ids)
        # ok: py-db-execute-built-string
        cur.execute(f"SELECT 1 FROM {self._table} WHERE n = %s", (name,))


def net(url):
    # ruleid: py-tls-verify-off
    requests.get(url, verify=False)
    # ruleid: py-tls-verify-off
    ssl._create_unverified_context()
    # ok: py-tls-verify-off
    requests.get(url, timeout=5)


def tmp():
    # ruleid: py-tempfile-mktemp
    name = tempfile.mktemp()
    # ok: py-tempfile-mktemp
    fd, path = tempfile.mkstemp()
    return name, fd, path
