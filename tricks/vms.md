run scripts on a VM

base ❯ az vm run-command invoke \
    --resource-group $RG \
    --name web-vm-1 \
    --command-id RunShellScript \
    --scripts "cat /home/azureuser/.ssh/authorized_keys"
{
  "value": [
    {
      "code": "ProvisioningState/succeeded",
      "displayStatus": "Provisioning succeeded",
      "level": "Info",
      "message": "Enable succeeded: \n[stdout]\nssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPWopdyrgZKL9A2TlA9j1+89v5fSVzInECcGVrtTpxRF davydewaele@Davys-MacBook-Pro.local\n\n[stderr]\n"
    }
  ]
}


az vm run-command invoke \
    --resource-group $RG \
    --name <vm-name> \
    --command-id RunShellScript \
    --scripts "echo '$(cat ~/.ssh/id_ed25519.pub)' >> /home/azureuser/.ssh/authorized_keys"

  Or more safely, using tee -a to avoid accidental overwrites:

  az vm run-command invoke \
    --resource-group $RG \
    --name <vm-name> \
    --command-id RunShellScript \
    --scripts "echo '$(cat ~/.ssh/id_ed25519.pub)' | tee -a /home/azureuser/.ssh/authorized_keys"

  This is useful exactly for situations like yours — VM deployed with a different key (or wrong key), and you need to add your current one without redeploying.
