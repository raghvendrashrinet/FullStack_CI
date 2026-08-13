### environment, branch, and namespace
1. Branch (Git)
 - A branch in Git represents a line of development.
    * main → production code
    * develop → staging/pre‑prod
    * feature/* → developer experiments
##### Usage in pipelines:
- Push to main → deploy to Production
- Push to develop → deploy to Staging
- Push to feature/* → run tests only

### Environment (Pipeline Concept)
An environment is a logical grouping in CI/CD that represents where code runs
Examples: dev, staging, prod.
- GitHub Actions has Environments with rules (like approvals before deploying to prod).
- Define secrets per environment (different DB passwords, API keys).

### Namespace (Kubernetes)
A namespace is a way to isolate resources inside a Kubernetes cluster
- You can deploy the same app into different namespaces to represent environments:
- `dev namespace` → `developers test`
- `staging namespace` → `QA validation`
- `prod namespace` → `live user`

  ### 🔎 How They Work Together
 ```
  Git Branches        Pipeline Environments        AKS Namespaces
-------------       ---------------------        --------------
feature/login  --->   CI only (tests)       --->   (no deploy)
develop        --->   Staging               --->   namespace: staging
main           --->   Production            --->   namespace: prod

```
#### 🛠 Real‑World Example
- Step 1: Developer pushes code
Push to develop branch.

- Step 2: GitHub Actions workflow triggers
```yaml
on:
  push:
    branches:
      - develop
```
- Step 3: Pipeline selects environment
```yaml
jobs:
  deploy-staging:
    environment: staging
```
- Step 4: Deploy to AKS namespace
```yaml
- name: Set AKS context
  uses: azure/aks-set-context@v3
  with:
    resource-group: myRG
    cluster-name: myAKSCluster

- name: Deploy to Staging
  uses: azure/k8s-deploy@v4
  with:
    manifests: |
      k8s/deployment.yaml
      k8s/service.yaml
    namespace: staging
```
### 📊 ASCII Visualization
```Code
          ┌──────────────┐
          │   Developer  │
          └──────┬───────┘
                 │ push
        ┌────────▼────────┐
        │   Git Branches  │
        └──────┬──────────┘
               │
   ┌───────────┼─────────────┐
   │           │             │
feature/*   develop        main
   │           │             │
   │           │             │
   │           ▼             ▼
   │     Staging Env     Production Env
   │           │             │
   │           ▼             ▼
   │     AKS Namespace   AKS Namespace
   │        staging          prod
   │
   ▼
Tests only (no deploy)
```
---
### 🔎 How a Single Pipeline Handles Multiple Environments
- Step 1: Branch triggers
`feature/* `→ run tests only (no deploy).
`develop` → deploy to staging.
`main` → deploy to production.

- Step 2: Environment mapping
GitHub Actions (or Azure DevOps, Jenkins, etc.) defines environments with secrets and rules.
Example:

- Environment staging → uses staging DB credentials.
- Environment prod → requires manual approval before deployment.

- Step 3: Namespace separation
Same AKS cluster, different namespaces:
- staging namespace → QA validation.
- prod namespace → live users.

```
                ┌───────────────┐
                │   Git Branch  │
                └───────┬───────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   feature/*         develop          main
        │               │               │
        │               │               │
   Tests only       Deploy to        Deploy to
   (CI only)        Staging Env      Production Env
                        │               │
                        ▼               ▼
                 Namespace: staging  Namespace: prod
                 Secrets: staging    Secrets: prod

```

---
##### unified workflow YAML file for Prod/Staging/Tests
keep everything inside a single, unified workflow YAML file (or use reusable templates)

#### How different env pipe;ine gets triggers
- a single pipeline file manages the end-to-end lifecycle based on `triggers`, `conditional logic (if)`, and `environments`

1. **Feature push/Pull Request** $\rightarrow$ Triggers `build / unit-tests jobs` only.
2. **Merge to develop** $\rightarrow$ Triggers build $\rightarrow$ `deploy-staging` (into the `staging Kubernetes namespace`).
3. `Merge to main `$\rightarrow$ Triggers` build` $\rightarrow$ `deploy-prod` (into the `prod Kubernetes namespace`) with mandatory approval gates.  \
   
   **Prod and other env deployment are 95% identical ,only target env,secret group and ns change** 
  
### 🛠 Real‑World Example Workflow (GitHub Actions)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
      - develop
      - 'feature/*'

jobs: ## multi stage pipeline
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - run: echo "Run tests here"

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    environment: staging
    runs-on: ubuntu-latest
    steps:
    - name: Azure Login
      uses: azure/login@v1
      with:
        client-id: ${{ secrets.AZURE_CLIENT_ID }}
        tenant-id: ${{ secrets.AZURE_TENANT_ID }}
        subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
    - name: Set AKS context
      uses: azure/aks-set-context@v3
      with:
        resource-group: myRG
        cluster-name: myAKSCluster
    - name: Deploy to Staging
      uses: azure/k8s-deploy@v4
      with:
        manifests: k8s/
        namespace: staging

  deploy-prod:
    if: github.ref == 'refs/heads/main'
    environment: production
    runs-on: ubuntu-latest
    steps:
    - name: Azure Login
      uses: azure/login@v1
      with:
        client-id: ${{ secrets.AZURE_CLIENT_ID }}
        tenant-id: ${{ secrets.AZURE_TENANT_ID }}
        subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
    - name: Set AKS context
      uses: azure/aks-set-context@v3
      with:
        resource-group: myRG
        cluster-name: myAKSCluster
    - name: Deploy to Production
      uses: azure/k8s-deploy@v4
      with:
        manifests: k8s/
        namespace: prod
```


✅ Practical Takeaway
One pipeline file can handle all environments.
- `Branch → Environment → Namespace` mapping decides where code goes.
- Secrets and approvals differ per environment.

This ensures consistency: same pipeline logic, different targets.

> [!NOTE]
> 👉 In real companies, this pattern is standard: developers push to develop → staging namespace; QA validates; merge to main → production namespace.


---

##### let’s build a full CI/CD pipeline that covers the entire flow:
`build → push image to ACR → deploy to AKS, with staging and production environments separated by branch and namespace.`


```Code
Developer Push
   │
   ├── feature/*  → CI only (tests)
   ├── develop    → Deploy to Staging (namespace: staging)
   └── main       → Deploy to Production (namespace: prod)
```
#### 🛠 GitHub Actions Workflow Example
Save this as .github/workflows/ci-cd.yml:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
      - develop
      - 'feature/*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - run: echo "Run unit tests here"

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    environment: staging
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    env:
      REGISTRY_NAME: mycontainerregistry
      IMAGE_NAME: myapp
      IMAGE_TAG: ${{ github.sha }}
    steps:
    - uses: actions/checkout@v3

    - name: Azure Login
      uses: azure/login@v1
      with:
        client-id: ${{ secrets.AZURE_CLIENT_ID }}
        tenant-id: ${{ secrets.AZURE_TENANT_ID }}
        subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

    - name: Build and Push image
      run: |
        docker build -t ${{ env.REGISTRY_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }} .
        docker push ${{ env.REGISTRY_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }}

    - name: Set AKS context
      uses: azure/aks-set-context@v3
      with:
        resource-group: myRG
        cluster-name: myAKSCluster

    - name: Deploy to Staging
      uses: azure/k8s-deploy@v4
      with:
        manifests: k8s/
        namespace: staging
        images: |
          ${{ env.REGISTRY_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }}

  deploy-prod:
    if: github.ref == 'refs/heads/main'
    environment: production
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    env:
      REGISTRY_NAME: mycontainerregistry
      IMAGE_NAME: myapp
      IMAGE_TAG: ${{ github.sha }}
    steps:
    - uses: actions/checkout@v3

    - name: Azure Login
      uses: azure/login@v1
      with:
        client-id: ${{ secrets.AZURE_CLIENT_ID }}
        tenant-id: ${{ secrets.AZURE_TENANT_ID }}
        subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

    - name: Build and Push image
      run: |
        docker build -t ${{ env.REGISTRY_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }} .
        docker push ${{ env.REGISTRY_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }}

    - name: Set AKS context
      uses: azure/aks-set-context@v3
      with:
        resource-group: myRG
        cluster-name: myAKSCluster

    - name: Deploy to Production
      uses: azure/k8s-deploy@v4
      with:
        manifests: k8s/
        namespace: prod
        images: |
          ${{ env.REGISTRY_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }}
```
 🔎 Real‑World Running Example
1. Developer pushes code to develop.
   * Pipeline builds Docker image → pushes to ACR → deploys to AKS staging namespace.
   * QA tests staging.
Once approved, code is merged to main.

2. Pipeline runs again → deploys to `AKS prod namespace` with same image.  
   * One pipeline file handles all environments.
     - `Branch → Environment → Namespace mapping controls deployment.`
   * Secrets differ per environment (DB, API keys).
   * Images are versioned by commit SHA, ensuring traceability.
