# Lab 01: Exploring the Microsoft 365 Admin Centers

## Overview

Navigate the core Microsoft 365 admin centers, explore organisation settings, user management, licensing, and the key objects in Exchange, SharePoint, and Teams.

### Learning Objectives

- Navigate the Microsoft 365 admin center (users, groups, licenses, org settings)
- Explore Exchange Online admin center (mailboxes, distribution lists)
- Explore SharePoint admin center (sites, libraries, permissions)
- Explore Teams admin center (teams, channels, policies)

## Prerequisites

- Microsoft 365 tenant (trial or paid — E3/E5 recommended)
- Global Administrator or appropriate admin role

## Steps

### 1. Microsoft 365 Admin Center

Navigate to https://admin.microsoft.com

**Explore:**
1. **Home** — dashboard with service health, usage metrics, billing status
2. **Users > Active users** — view all users, their licenses, and sign-in status
3. **Teams & groups** — view M365 groups, security groups, distribution lists
4. **Billing > Licenses** — see available licenses and assignment counts
5. **Settings > Org settings** — review domain names, release preferences, organisation profile
6. **Health > Service health** — check current service status and advisories

**Try:**
- Create a test user and assign an M365 E5 trial license
- Create a Microsoft 365 group
- View the Message Centre for upcoming changes

### 2. Exchange Online Admin Center

Navigate to https://admin.exchange.microsoft.com

**Explore:**
1. **Recipients > Mailboxes** — view user mailboxes, shared mailboxes
2. **Recipients > Groups** — distribution lists, M365 groups, mail-enabled security groups
3. **Mail flow > Rules** — transport rules for email routing and filtering
4. **Mail flow > Connectors** — connections to on-premises or third-party mail systems

**Try:**
- Create a shared mailbox for a department (e.g., support@contoso.com)
- Create a distribution list and add members
- View mail flow rules (if any exist)

### 3. SharePoint Admin Center

Navigate to https://admin.microsoft.com/sharepoint

**Explore:**
1. **Sites > Active sites** — view all SharePoint sites, storage usage, sharing settings
2. Click into a site to see:
   - Permissions (Owners, Members, Visitors)
   - Sharing settings (external sharing, access requests)
   - Storage used
3. **Policies > Sharing** — global sharing settings
4. **Settings** — default site creation, storage limits

**Try:**
- Create a new Team site and a Communication site
- Review permissions on each site (Owner, Member, Visitor)
- Upload a document to a library and explore versioning settings

### 4. Teams Admin Center

Navigate to https://admin.teams.microsoft.com

**Explore:**
1. **Teams > Manage teams** — view all teams, members, channels
2. **Messaging policies** — control chat features (editing, deleting, giphy)
3. **Meeting policies** — control meeting features (recording, transcription, lobby)
4. **Teams apps > Permission policies** — control which apps users can install
5. **Teams apps > Setup policies** — pin apps for users

**Try:**
- Review the default messaging and meeting policies
- Create a custom app permission policy that blocks third-party apps
- View the available Teams apps catalog

## Summary

You navigated all four core admin centers (M365, Exchange, SharePoint, Teams) and explored the key objects and settings in each. Understanding which admin center manages which objects is essential for the AB-900 exam.

## Key Takeaways

| Admin Center | Key Objects |
|-------------|-------------|
| M365 admin center | Users, groups, licenses, org settings, health |
| Exchange Online | Mailboxes, distribution lists, mail flow rules |
| SharePoint | Sites, libraries, permissions, sharing policies |
| Teams | Teams, channels, policies, apps |
