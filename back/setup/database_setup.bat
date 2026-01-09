REM @echo off
docker run -d --name afad-postgres ^
  -e POSTGRES_DB=mydb ^
  -e POSTGRES_USER=myuser ^
  -e POSTGRES_PASSWORD=mypassword ^
  -p 5432:5432 ^
  -v afad_pgdata:/var/lib/postgresql/data ^
  postgres:17
pause
