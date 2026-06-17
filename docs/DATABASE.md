# Database Design

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ CaseAssignment : "assigned to"
    User ||--o{ Document : "uploads"
    User ||--o{ Task : "assigned"
    User ||--o{ Task : "creates"
    User ||--o{ TimeEntry : "logs"
    User ||--o{ Event : "creates"
    User ||--o{ ActivityLog : "performs"
    User ||--o{ Notification : "receives"
    User ||--o{ PasswordResetToken : "has"

    Client ||--o{ Case : "has"
    Client ||--o{ Invoice : "billed"

    Case ||--o{ CaseAssignment : "has"
    Case ||--o{ CaseNote : "has"
    Case ||--o{ Document : "contains"
    Case ||--o{ Task : "has"
    Case ||--o{ TimeEntry : "tracks"
    Case ||--o{ Event : "linked"
    Case ||--o{ InvoiceItem : "referenced"

    Document ||--o{ Document : "versions"

    Invoice ||--o{ InvoiceItem : "contains"
    Invoice ||--o{ Payment : "receives"

    TimeEntry ||--o| InvoiceItem : "billed as"

    Permission ||--o{ RolePermission : "granted to"

    User {
        string id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        enum role
        boolean isActive
        datetime createdAt
    }

    Client {
        string id PK
        string firstName
        string lastName
        string companyName
        string email
        enum clientType
        boolean isArchived
    }

    Case {
        string id PK
        string caseNumber UK
        string title
        enum category
        enum status
        string clientId FK
        datetime filingDate
    }

    CaseAssignment {
        string id PK
        string caseId FK
        string userId FK
        boolean isLead
    }

    Document {
        string id PK
        string fileName
        string storageUrl
        enum category
        int version
        string caseId FK
        string uploadedById FK
    }

    Task {
        string id PK
        string title
        enum status
        enum priority
        datetime dueDate
        string caseId FK
        string assigneeId FK
    }

    Event {
        string id PK
        string title
        enum type
        datetime startTime
        datetime endTime
        string caseId FK
        string userId FK
    }

    TimeEntry {
        string id PK
        string caseId FK
        string userId FK
        decimal hours
        decimal rate
    }

    Invoice {
        string id PK
        string invoiceNumber UK
        string clientId FK
        decimal totalAmount
        enum status
        datetime dueDate
    }

    InvoiceItem {
        string id PK
        string invoiceId FK
        string description
        decimal amount
    }

    Payment {
        string id PK
        string invoiceId FK
        decimal amount
        datetime paymentDate
    }

    ActivityLog {
        string id PK
        string userId FK
        string action
        string entity
        string ipAddress
        datetime createdAt
    }

    Notification {
        string id PK
        string userId FK
        enum type
        string title
        boolean isRead
    }
```

## Enums

### UserRole
- SUPER_ADMIN, MANAGING_PARTNER, LAWYER, PARALEGAL, SECRETARY, ACCOUNTANT, CLIENT

### CaseStatus
- NEW, ACTIVE, PENDING, IN_COURT, SETTLED, CLOSED

### TaskStatus
- TODO, IN_PROGRESS, COMPLETED

### TaskPriority
- LOW, MEDIUM, HIGH, CRITICAL

### InvoiceStatus
- DRAFT, SENT, PAID, OVERDUE

### EventType
- HEARING, MEETING, COURT_APPEARANCE, DEADLINE, REMINDER

### DocumentCategory
- PLEADING, EVIDENCE, CORRESPONDENCE, CONTRACT, COURT_ORDER, RESEARCH, OTHER

## Indexes

Key indexes are defined on:
- User email, role
- Client email, name, archived status
- Case caseNumber, status, clientId
- Document caseId, fileName
- Task status, dueDate, assigneeId
- Event startTime, caseId
- Invoice invoiceNumber, status, clientId
- ActivityLog userId, entity, createdAt
- Notification userId + isRead
