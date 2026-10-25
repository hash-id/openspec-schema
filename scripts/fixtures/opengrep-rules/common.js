const child_process = require("child_process");

function run(code, user, el, db, id) {
  // ruleid: js-eval-built-code
  eval(code);
  // ruleid: js-eval-built-code
  const f = new Function("a", code);
  // ok: js-eval-built-code
  eval("1 + 1");

  // ruleid: js-child-process-built-command
  child_process.exec("ls " + user);
  // ruleid: js-child-process-built-command
  child_process.execSync(user);
  // ok: js-child-process-built-command
  child_process.exec("ls -l");
  // ok: js-child-process-built-command
  child_process.execFile("ls", [user]);

  // ruleid: js-dom-html-sink
  el.innerHTML = user;
  // ruleid: js-dom-html-sink
  document.write(user);
  // ok: js-dom-html-sink
  el.innerHTML = "<b>fixed</b>";
  // ok: js-dom-html-sink
  el.textContent = user;

  // ruleid: js-sql-built-string
  db.query(`SELECT * FROM t WHERE id = ${id}`);
  // ruleid: js-sql-built-string
  query.whereRaw(`msisdn ilike '%${id}'`);
  // ruleid: js-sql-built-string
  Database.rawQuery("SELECT * FROM t WHERE id = " + id);
  // ruleid: js-sql-built-string
  prisma.$queryRawUnsafe(`SELECT ${id}`);
  // ok: js-sql-built-string
  db.query("SELECT * FROM t WHERE id = $1", [id]);
  // ok: js-sql-built-string
  db.query(`SELECT * FROM t`);
  // ok: js-sql-built-string
  query.whereRaw("msisdn ilike ?", [id]);
  // ok: js-sql-built-string
  Model.query().where("id", id);
  // ok: js-sql-built-string
  Database.rawQuery(`SELECT * FROM t WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
  // ok: js-sql-built-string
  Database.rawQuery(`VACUUM FULL ${this.table}`);
  // ok: js-sql-built-string
  Database.rawQuery(`ALTER TABLE t DISABLE TRIGGER ${TRIGGER_NAME}`);
  // ruleid: js-sql-built-string
  Database.rawQuery(`SELECT * FROM ${this.table} WHERE id = '${id}'`);

  // ruleid: js-tls-verify-off
  const opts = { rejectUnauthorized: false };
  // ok: js-tls-verify-off
  const safe = { rejectUnauthorized: true };
  return [f, opts, safe];
}

// ruleid: js-tls-verify-off
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function view(html) {
  // ruleid: js-dom-html-sink
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function fixed() {
  // ok: js-dom-html-sink
  return <div dangerouslySetInnerHTML={{ __html: "<i>x</i>" }} />;
}
