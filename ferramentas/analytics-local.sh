#!/bin/sh
# Disposable synthetic analytics database. Never connects to the hosted project.
set -eu
analytics_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
analytics_bin=${ANALYTICS_PG_BIN:-$(pg_config --bindir)}
analytics_state="$analytics_root/.local/analytics"
analytics_port=55439
analytics_action=${1:-start}
case "$analytics_action" in
 start)
  mkdir -p "$analytics_state"
  if [ ! -f "$analytics_state/pgdata/PG_VERSION" ]; then
   "$analytics_bin/initdb" -D "$analytics_state/pgdata" -A trust -U postgres --encoding=UTF8 --no-locale
   touch "$analytics_state/needs-schema"
  fi
  if ! "$analytics_bin/pg_ctl" -D "$analytics_state/pgdata" status >/dev/null 2>&1; then
   "$analytics_bin/pg_ctl" -D "$analytics_state/pgdata" -l "$analytics_state/server.log" -o "-p $analytics_port -h 127.0.0.1" start
  fi
  if [ -f "$analytics_state/needs-schema" ]; then
   "$analytics_bin/psql" -h 127.0.0.1 -p "$analytics_port" -U postgres -v ON_ERROR_STOP=1 -f "$analytics_root/tests/bootstrap.sql"
   for analytics_migration in "$analytics_root"/supabase/migrations/*_bio_analytics_*.sql; do
    "$analytics_bin/psql" -h 127.0.0.1 -p "$analytics_port" -U postgres -v ON_ERROR_STOP=1 -f "$analytics_migration"
   done
   rm "$analytics_state/needs-schema"
  fi
  ;;
 stop) "$analytics_bin/pg_ctl" -D "$analytics_state/pgdata" stop -m fast ;;
 test) PSQL="$analytics_bin/psql" python3 "$analytics_root/tests/database.py" ;;
 backup) "$analytics_bin/pg_dump" -h 127.0.0.1 -p "$analytics_port" -U postgres -Fc -f "$analytics_state/synthetic-backup.dump" postgres ;;
 *) printf '%s\n' 'Usage: analytics-local.sh start|stop|test|backup'; exit 2 ;;
esac
