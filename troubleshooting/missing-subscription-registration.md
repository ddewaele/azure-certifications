# Error: MissingSubscriptionRegistration

## Symptom

```
{"code":"MissingSubscriptionRegistration","message":"The subscription is not registered to use namespace 'Microsoft.Network'."}
```

You get this when trying to create a resource (VM, storage account, etc.) and the required Azure resource provider hasn't been registered on your subscription.

## Why This Happens

Azure subscriptions don't automatically have all resource providers enabled. Each Azure service is backed by a **resource provider** (a namespace like `Microsoft.Network`, `Microsoft.Compute`). On a new or restricted subscription, some providers need to be explicitly registered before you can deploy resources that depend on them.

## Fix

Register the missing namespace:

```bash
az provider register --namespace Microsoft.Network
```

Check registration status (it takes 1–2 minutes):

```bash
az provider show --namespace Microsoft.Network --query "registrationState" --output tsv
# Should output: Registered
```

Then retry your original command.

## Register All Common Providers Up Front

If you're working through the labs, register all the providers you'll need in one go to avoid hitting this multiple times:

```bash
for ns in \
  Microsoft.Network \
  Microsoft.Compute \
  Microsoft.Storage \
  Microsoft.Web \
  Microsoft.ContainerInstance \
  Microsoft.ContainerService \
  Microsoft.Insights \
  Microsoft.OperationsManagement \
  Microsoft.OperationalInsights; do
  echo "Registering $ns..."
  az provider register --namespace $ns
done
```

Check all at once:

```bash
az provider list \
  --query "[?registrationState=='Registered'].namespace" \
  --output table
```

Or check just the ones above:

```bash
for ns in \
  Microsoft.Network \
  Microsoft.Compute \
  Microsoft.Storage \
  Microsoft.Web \
  Microsoft.ContainerInstance \
  Microsoft.ContainerService \
  Microsoft.Insights; do
  state=$(az provider show --namespace $ns --query registrationState -o tsv 2>/dev/null || echo "NotFound")
  echo "$ns: $state"
done
```

## Notes

- Registration is per-subscription — if you switch subscriptions you may need to register again
- Some providers are registered automatically when you first use a service via the portal
- Registration is free and has no impact on billing
