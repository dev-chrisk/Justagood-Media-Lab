<template>
  <div class="version-info">
    <span class="version-label">Build #{{ version }}</span>
  </div>
</template>

<script>
export default {
  name: 'VersionInfo',
  data() {
    return {
      version: import.meta.env.VITE_APP_VERSION || '1.0.0'
    }
  }
}
</script>

<style scoped>
.version-info {
  padding: 8px 16px;
  border-top: 1px solid #404040;
  background: #1a1a1a;
  text-align: center;
}

.version-label {
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
  letter-spacing: 0.5px;
}
</style>
