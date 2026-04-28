# Install Azure CLI on a VM and Authenticate

How to get the Azure CLI running on an Azure VM and authenticate it — without storing credentials on disk.

---

## Variables

```bash
# Run these from your local machine (before connecting to the VM)
RG=rg-vnet-peering
VM=vm-hub
IDENTITY_NAME=id-vm-hub          # name for a user-assigned managed identity (if used)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
```

---

## Part 1: Install Azure CLI on the VM

SSH into the VM first, then run one of the following.

### One-liner (Ubuntu / Debian)

```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Manual package repo setup (more control, same result)

```bash
# Install prerequisites
sudo apt-get update && sudo apt-get install -y ca-certificates curl apt-transport-https lsb-release gnupg

# Add Microsoft signing key
curl -sLS https://packages.microsoft.com/keys/microsoft.asc \
  | gpg --dearmor \
  | sudo tee /etc/apt/keyrings/microsoft.gpg > /dev/null

# Add the Azure CLI repo
AZ_DIST=$(lsb_release -cs)
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/microsoft.gpg] \
  https://packages.microsoft.com/repos/azure-cli/ $AZ_DIST main" \
  | sudo tee /etc/apt/sources.list.d/azure-cli.list

# Install
sudo apt-get update && sudo apt-get install -y azure-cli
```

### Verify

```bash
az version
az --version
```

---

## Part 2: Authenticate

There are three options. **Managed identity is strongly preferred** for VMs — no passwords, no secrets stored on disk, and no token expiry to manage.

---

### Option A: System-assigned managed identity (recommended)

A system-assigned identity is tied to the VM's lifecycle — it is created and deleted with the VM.

**Step 1 — enable the identity on the VM** (run from your local machine):

```bash
az vm identity assign -g $RG -n $VM
```

This returns the `principalId` of the new identity. Save it:

```bash
PRINCIPAL_ID=$(az vm show -g $RG -n $VM --query "identity.principalId" -o tsv)
echo $PRINCIPAL_ID
```

**Step 2 — assign an RBAC role** so the identity can actually do something:

```bash
# Example: Contributor on the resource group
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Contributor" \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG

# Example: Reader on the whole subscription
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Reader" \
  --scope /subscriptions/$SUBSCRIPTION_ID
```

**Step 3 — log in from inside the VM** (run on the VM):

```bash
az login --identity
az account show   # confirm which subscription and identity you're using
```

---

### Option B: User-assigned managed identity

A user-assigned identity is a standalone resource that can be attached to multiple VMs and survives VM deletion. Useful when you want to share an identity across VMs or pre-configure permissions before the VM exists.

**Step 1 — create the identity** (run from your local machine):

```bash
az identity create -g $RG -n $IDENTITY_NAME
```

**Step 2 — assign it to the VM:**

```bash
IDENTITY_ID=$(az identity show -g $RG -n $IDENTITY_NAME --query id -o tsv)
az vm identity assign -g $RG -n $VM --identities $IDENTITY_ID
```

**Step 3 — assign an RBAC role to the identity:**

```bash
PRINCIPAL_ID=$(az identity show -g $RG -n $IDENTITY_NAME --query principalId -o tsv)

az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Contributor" \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG
```

**Step 4 — log in from inside the VM using the client ID:**

```bash
CLIENT_ID=$(az identity show -g $RG -n $IDENTITY_NAME --query clientId -o tsv)
az login --identity --username $CLIENT_ID
```

> Use `--username` with the **client ID** (not the principal ID or object ID) when logging in from the VM. This matters when a VM has multiple user-assigned identities.

---

### Option C: Service principal (fallback, avoid if possible)

Use this only when a managed identity is not an option (e.g., running on a non-Azure machine or a scenario where identity assignment isn't available).

```bash
az login --service-principal \
  --username <app-id> \
  --password <client-secret> \
  --tenant <tenant-id>
```

This requires storing the client secret somewhere on the VM, which is a security risk. Prefer managed identity whenever possible.

---

## How managed identity authentication works

When you run `az login --identity` on a VM, the Azure CLI calls the **Instance Metadata Service (IMDS)** at `169.254.169.254` to request a token. This endpoint is only reachable from inside the VM, so no credentials ever leave the machine.

```
VM  →  169.254.169.254/metadata/identity/oauth2/token  →  Azure AD token
```

The token is scoped to the roles assigned to the identity. No username, password, or certificate is involved.

---

## Verify the authentication and permissions

```bash
# From inside the VM after az login --identity

# Which identity am I logged in as?
az account show

# Can I list VMs in the resource group?
az vm list -g $RG -o table

# What roles does this identity have?
az role assignment list --assignee $(az account show --query user.name -o tsv) -o table
```

---

## Tip: Check which identities are assigned to the VM

```bash
# From your local machine
az vm show -g $RG -n $VM --query "identity" -o json
```

Output will show `type` (`SystemAssigned`, `UserAssigned`, or `SystemAssigned, UserAssigned`) and the principal/client IDs.
