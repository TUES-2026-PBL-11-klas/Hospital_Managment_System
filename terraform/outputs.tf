output "argocd_ui" {
  description = "ArgoCD web UI URL"
  value       = "http://localhost:30080"
}

output "grafana_ui" {
  description = "Grafana web UI URL"
  value       = "http://localhost:30300"
}

output "argocd_initial_password_cmd" {
  description = "Command to retrieve the initial ArgoCD admin password"
  value       = "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
}

output "app_url" {
  description = "MediNest application URL (requires /etc/hosts entry)"
  value       = "http://medinest.local"
}
