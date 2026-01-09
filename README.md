# AFAD-Homework
AFAD Address Reporting System re-implemented with duplicate address dropping feature

# Preview
## Home Page
![1](https://github.com/user-attachments/assets/1978658e-aa86-4998-abbb-b41744fb4ec7)
## Report Page
![3](https://github.com/user-attachments/assets/59bce3d7-2417-481a-8c2c-0b0c217f1abf)
## Duplicate Address Drop
<img width="749" height="635" alt="7" src="https://github.com/user-attachments/assets/4b4cce48-c94f-4ae9-a8bf-a96258a31a8e" />

It is matching with **"Adres mah adrese benzeyen sok havalı bir ap daire 31"**

## Similar Address Accepting
![6](https://github.com/user-attachments/assets/01e23a84-ceed-42a9-9a94-d3de2be1df75)

# Setup
## Requirments
- Docker
- PostgreSQL
- Node.js

## Set Database
**NOTE:** Replace your PostgreSQL version where **"postgres:17"**
```
docker run -d --name afad-postgres ^
  -e POSTGRES_DB=mydb ^
  -e POSTGRES_USER=myuser ^
  -e POSTGRES_PASSWORD=mypassword ^
  -p 5432:5432 ^
  -v afad_pgdata:/var/lib/postgresql/data ^
  postgres:17
```

## Start Server
```
docker compose up --build
```
