#!/usr/bin/env bash
# Updates Jira issue start/due dates for the sprint plan.
# Usage: JIRA_TOKEN=<pat> JIRA_EMAIL=<email> JIRA_BASE_URL=https://your-org.atlassian.net ./update-jira-dates.sh
#
# Requires: curl, jq

set -euo pipefail

: "${JIRA_TOKEN:?Set JIRA_TOKEN (Personal Access Token or API token)}"
: "${JIRA_EMAIL:?Set JIRA_EMAIL}"
: "${JIRA_BASE_URL:?Set JIRA_BASE_URL (e.g. https://your-org.atlassian.net)}"

AUTH=$(echo -n "${JIRA_EMAIL}:${JIRA_TOKEN}" | base64)

update_issue() {
  local issue="$1"
  local start="$2"
  local due="$3"

  echo -n "Updating ${issue} (${start} → ${due})... "
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PUT "${JIRA_BASE_URL}/rest/api/3/issue/${issue}" \
    -H "Authorization: Basic ${AUTH}" \
    -H "Content-Type: application/json" \
    -d "{
      \"fields\": {
        \"startDate\": \"${start}\",
        \"duedate\": \"${due}\"
      }
    }")

  if [[ "$response" == "204" ]]; then
    echo "OK"
  else
    echo "FAILED (HTTP ${response})"
  fi
}

# Week 1: Apr 20–26
for ticket in MGMT-23923 MGMT-23898 MGMT-23899 MGMT-23900 MGMT-23901 MGMT-23945; do
  update_issue "$ticket" "2026-04-20" "2026-04-26"
done

# Week 2: Apr 27–May 3
for ticket in MGMT-23902 MGMT-23903 MGMT-23904 MGMT-23905 MGMT-23906 MGMT-23907 MGMT-23908 MGMT-23944; do
  update_issue "$ticket" "2026-04-27" "2026-05-03"
done

# Week 5: May 18–24
for ticket in MGMT-23456 MGMT-23929; do
  update_issue "$ticket" "2026-05-18" "2026-05-24"
done

# Week 7: Jun 1–7
update_issue "MGMT-23836" "2026-06-01" "2026-06-07"

# Week 8: Jun 8–14
for ticket in MGMT-23940 MGMT-23947 MGMT-23948; do
  update_issue "$ticket" "2026-06-08" "2026-06-14"
done

echo ""
echo "Done. Tickets without explicit IDs (Weeks 3, 4, 6) were skipped."
