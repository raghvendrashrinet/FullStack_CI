### 🏗️ Step 1: Manual First Deployment (Building the Foundation)
#### The Logic
Before setting up automation in GitHub Actions, you must prove that your app can actually build and run on the host (Fly.io or Render). Automating a process that fails manually will only result in broken CI/CD pipelines.

#### The Implementation
1. Choose your platform: Pick either Fly.io or Render (you only need to do one).

##### 2. Fly.io Setup:
- reate your app on Fly.io and generate a deploy token using the CLI:

```Bash
fly tokens create deploy
```
Update your `fly.toml` file to specify your start process, environment variables, and memory settings:

```Ini, TOML
app = 'your-app-name'
primary_region = 'arn'

[env]
  PORT = "5001"

[processes]
  app = "node app.js"

[http_service]
  internal_port = 5001
  force_https = true
```

##### 3. Render Setup:

- Set up a Web Service on Render and create a build script (e.g., build_step.sh) to bundle your app:

```Bash
#!/bin/bash
npm install
npm run build
```
- Turn OFF "Auto-Deploy" in Render's advanced settings so GitHub Actions can control when code goes live.

##### Pipeline / Execution Test
Run a manual build and deploy once from your terminal to verify it succeeds:

```Bash
npm run build
flyctl deploy   # (or Manual Deploy button on Render)
```


### ⚡ Step 2: Automated Deployment via GitHub Actions
#### The Logic
Once the app works manually, hand over deployment responsibility to GitHub Actions. Every time you push code to main (and your tests pass), GitHub will securely trigger a deploy.

#### The Implementation
##### 1. Store Secrets in GitHub:

- Never put tokens or secret URLs directly in your code.

- Go to your GitHub repository: `Settings > Secrets and variables > Actions > New repository secret.`

- Add `FLY_API_TOKEN (for Fly.io)` or `RENDER_DEPLOY_HOOK (for Render)`.

##### 2. Add Deploy Step to .github/workflows/pipeline.yml:

###### For Fly.io:

```YAML
- name: Setup flyctl
  uses: superfly/flyctl-actions/setup-flyctl@master

- name: Build Project
  run: npm run build

- name: Deploy to Fly.io
  run: flyctl deploy --remote-only
  env:
    FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```
###### For Render:

```YAML
- name: Build Project
  run: npm run build

- name: Trigger Render Deployment
  run: curl ${{ secrets.RENDER_DEPLOY_HOOK }}
```

#### Pipeline Execution
Push a new commit to your repository on GitHub. Watch the GitHub Actions runner log into your cloud provider using the secret token and deploy your app automatically!

### 🩺 Step 3: Health Checks & Safe Deployments (Zero Downtime)
##### The Logic
- What if a bad update gets pushed and breaks server startup? If you deploy blindly, real users will see a broken page.

- To solve this, configure Health Checks. Your cloud provider pings a specific backend URL (/health). If it gets an "ok", the new deployment goes live. If it fails, the new version is rejected, and your previous working version stays live (known as a Canary Deployment or Zero-Downtime Deployment).

##### The Implementation
- Add a Health Route in Express (app.js):

```JavaScript
app.get('/health', (req, res) => {
  res.send('ok')
})
```
Configure the Cloud Host:

###### In `fly.toml`:

```Ini, TOML
[http_service]
  internal_port = 5001

  [[http_service.checks]]
    grace_period = "5s"
    interval = "15s"
    method = "get"
    path = "/health"
    timeout = "2s"
```
And set the deployment strategy:

```Ini, TOML
[deploy]
  strategy = "canary"
```
###### In Render:
Go to your `Dashboard > Settings > Health Check Path and enter /health`.

###### Pipeline Execution & Error Testing
- Test a successful deploy with /health returning 'ok'.

- Simulate a Failure: Temporarily break your endpoint to throw an error:

```JavaScript
app.get('/health', (req, res) => {
  throw new Error('Server crash simulation!')
})
```
Push to GitHub. The workflow will run, but the cloud provider will detect the unhealthy route, abort the deployment, and keep the old, healthy version running live for your users!
