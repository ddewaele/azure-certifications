# Tricks

Quick copy-paste recipes for common Azure lab tasks.

| File | What it does |
|------|-------------|
| [quick-http-identity-server.md](./quick-http-identity-server.md) | Spin up a tiny HTTP server on a VM that shows its hostname and IPs — useful for testing load balancers, routing, and peering |
| [debug-no-outbound-connectivity.md](./debug-no-outbound-connectivity.md) | Diagnose why a VM has no outbound internet access — covers private subnet / defaultOutboundAccess, effective routes, NSG/UDR checks, fix options, and NAT Gateway costs |
| [debug-ssh-access.md](./debug-ssh-access.md) | Diagnose and fix SSH access issues — NSG rules, IP Flow Verify, recovering a missing/wrong authorized_keys via VMAccess extension, Run Command, or Serial Console |
| [install-azure-cli-and-auth.md](./install-azure-cli-and-auth.md) | Install Azure CLI on a VM and authenticate it — system-assigned managed identity, user-assigned managed identity, and service principal; includes RBAC role assignment and how IMDS token flow works |
| [move-vm-to-different-subnet.md](./move-vm-to-different-subnet.md) | Move a VM to a different subnet — same-VNet NIC update (no deallocation needed), static IP handling, cross-VNet NIC swap, and snapshot-based rebuild |
| [debug-load-balancer.md](./debug-load-balancer.md) | Diagnose why a Standard LB is unreachable — NSG source mismatch (AzureLoadBalancer vs Internet), backend pool membership, app bind address, IP Flow Verify, floating IP pitfall |
