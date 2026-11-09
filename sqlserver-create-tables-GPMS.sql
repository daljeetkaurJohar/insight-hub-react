/* ─────────────────────────────────────────────────────────────
   Insight Hub - tables in the existing GPMS database (SQL Server)
   Naming: T_IH_<NAME>  (T_ = table, IH = Insight Hub)

   How to run: SSMS -> connect -> New Query -> paste this file -> F5
   Safe to run again: a table that already exists is skipped.
   ───────────────────────────────────────────────────────────── */

USE GPMS;
GO

/* 1. People who log in */
IF OBJECT_ID(N'dbo.T_IH_USERS', N'U') IS NULL
CREATE TABLE dbo.T_IH_USERS (
    id           INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_T_IH_USERS PRIMARY KEY,
    external_id  NVARCHAR(200) NOT NULL CONSTRAINT UQ_T_IH_USERS_EXTERNAL_ID UNIQUE,  -- employee ID / login ID
    name         NVARCHAR(200) NOT NULL,
    email        NVARCHAR(320) NULL,
    created_at   DATETIME2 NOT NULL CONSTRAINT DF_T_IH_USERS_CREATED_AT DEFAULT SYSUTCDATETIME()
);
GO

/* 2. Knowledge entries */
IF OBJECT_ID(N'dbo.T_IH_ENTRIES', N'U') IS NULL
BEGIN
CREATE TABLE dbo.T_IH_ENTRIES (
    id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_T_IH_ENTRIES PRIMARY KEY,
    title           NVARCHAR(300) NOT NULL,
    channel         NVARCHAR(100) NOT NULL,
    sub_type        NVARCHAR(200) NULL,
    nature          NVARCHAR(20)  NOT NULL,       -- Observation | Idea | Problem
    source          NVARCHAR(300) NULL,
    location        NVARCHAR(300) NULL,
    entry_date      DATE NOT NULL,
    description     NVARCHAR(MAX) NOT NULL,
    contributor_id  INT NOT NULL CONSTRAINT FK_T_IH_ENTRIES_USERS REFERENCES dbo.T_IH_USERS(id),
    created_at      DATETIME2 NOT NULL CONSTRAINT DF_T_IH_ENTRIES_CREATED_AT DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2 NOT NULL CONSTRAINT DF_T_IH_ENTRIES_UPDATED_AT DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_T_IH_ENTRIES_ENTRY_DATE ON dbo.T_IH_ENTRIES(entry_date);
END
GO

/* 3. Images attached to entries (the files are in backend\uploads) */
IF OBJECT_ID(N'dbo.T_IH_ENTRY_IMAGES', N'U') IS NULL
CREATE TABLE dbo.T_IH_ENTRY_IMAGES (
    id             INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_T_IH_ENTRY_IMAGES PRIMARY KEY,
    entry_id       INT NOT NULL CONSTRAINT FK_T_IH_ENTRY_IMAGES_ENTRIES REFERENCES dbo.T_IH_ENTRIES(id) ON DELETE CASCADE,
    file_name      NVARCHAR(255) NOT NULL,
    original_name  NVARCHAR(255) NULL,
    created_at     DATETIME2 NOT NULL CONSTRAINT DF_T_IH_ENTRY_IMAGES_CREATED_AT DEFAULT SYSUTCDATETIME()
);
GO

/* 4. Comments */
IF OBJECT_ID(N'dbo.T_IH_COMMENTS', N'U') IS NULL
CREATE TABLE dbo.T_IH_COMMENTS (
    id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_T_IH_COMMENTS PRIMARY KEY,
    entry_id    INT NOT NULL CONSTRAINT FK_T_IH_COMMENTS_ENTRIES REFERENCES dbo.T_IH_ENTRIES(id) ON DELETE CASCADE,
    user_id     INT NOT NULL CONSTRAINT FK_T_IH_COMMENTS_USERS REFERENCES dbo.T_IH_USERS(id),
    body        NVARCHAR(MAX) NOT NULL,
    created_at  DATETIME2 NOT NULL CONSTRAINT DF_T_IH_COMMENTS_CREATED_AT DEFAULT SYSUTCDATETIME()
);
GO

/* 5. Star ratings, one per person per entry */
IF OBJECT_ID(N'dbo.T_IH_RATINGS', N'U') IS NULL
CREATE TABLE dbo.T_IH_RATINGS (
    entry_id    INT NOT NULL CONSTRAINT FK_T_IH_RATINGS_ENTRIES REFERENCES dbo.T_IH_ENTRIES(id) ON DELETE CASCADE,
    user_id     INT NOT NULL CONSTRAINT FK_T_IH_RATINGS_USERS REFERENCES dbo.T_IH_USERS(id),
    stars       INT NOT NULL CONSTRAINT CK_T_IH_RATINGS_STARS CHECK (stars BETWEEN 1 AND 5),
    updated_at  DATETIME2 NOT NULL CONSTRAINT DF_T_IH_RATINGS_UPDATED_AT DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_T_IH_RATINGS PRIMARY KEY (entry_id, user_id)
);
GO

PRINT 'Insight Hub tables are ready in GPMS.';
GO
