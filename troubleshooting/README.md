# Troubleshooting

Common errors encountered when working through the Azure CLI labs.

---

## Errors

| Error code | Description | Guide |
|---|---|---|
| `MissingSubscriptionRegistration` | Resource provider not enabled on subscription | [missing-subscription-registration.md](./missing-subscription-registration.md) |
| `RegistryErrorResponse` | ACI can't pull from Docker Hub due to rate limiting | [aci-docker-hub-registry-error.md](./aci-docker-hub-registry-error.md) |

---

## Quick Diagnostics

When a deployment fails, these commands help narrow down the cause:

```bash
# List recent deployment operations for a resource group
az deployment operation group list \
  --resource-group <rg-name> \
  --name <deployment-name> \
  --output table

# List all failed deployments in a resource group
az deployment group list \
  --resource-group <rg-name> \
  --filter "provisioningState eq 'Failed'" \
  --output table

# Check which resource providers are registered
az provider list --query "[?registrationState=='Registered'].namespace" --output table

# Check your current subscription
az account show --output table

# Check your account permissions on a resource group
az role assignment list --resource-group <rg-name> --output table
```
