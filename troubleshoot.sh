echo "===== Stopping all running dev processes ===== "
pkill node
pkill cargo
echo "===== Confirm port is free ====="
output=$(lsof -i :1420)
if [[ -z "$output" ]]; then
  echo "Command output is empty"
else
  echo "Command output is NOT empty. Output: $output"
  exit(1)
fi
echo "===== Delete Node dependencies and caches ====="
rm -rf node_modules
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vite
rm package-lock.json
echo "===== Clear Tauri/Rust build artifacts ====="
rm -rf src-tauri/target
echo "===== Reinstall dependencies cleanly ====="
npm install
