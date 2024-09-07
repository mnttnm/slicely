graph TD
    A[User] -->|Upload PDF| B(Supabase Storage)
    A -->|Create Proxy PDF| C(Annotation Service)
    C -->|Store Annotations| D[(Supabase Database)]
    A -->|Bulk Upload PDFs| E(Bulk Processing Queue)
    E -->|Process PDFs| F(Data Extraction Service)
    F -->|Store Extracted Data| D
    A -->|Search Data| G(Search Service)
    G -->|Query| D
    A -->|Update Annotations| C
    C -->|Trigger Reprocessing| E

    subgraph "Frontend - Next.js"
        H[PDF Viewer]
        I[Annotation Tool]
        J[Search Interface]
        K[User Dashboard]
    end

    subgraph "Backend Services"
        L[PDF Processing API]
        M[Authentication Service]
        N[Data Management API]
    end

    subgraph "External Services"
        O[OpenAI API]
        P[Email Service]
    end

    H -->|Display PDF| B
    I -->|Create/Update Annotations| C
    J -->|Submit Search| G
    K -->|Manage PDFs/Data| N
    L -->|Process PDFs| F
    M -->|Authenticate Users| A
    N -->|Manage Data| D
    F -->|AI-assisted Extraction| O
    A -->|Receive Notifications| P