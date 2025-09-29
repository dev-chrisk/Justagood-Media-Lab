<template>
  <div class="version-info" @click="toggleDetails" :title="showDetails ? 'Click to hide details' : 'Click to show details'">
    <span class="version-text">v{{ version }}</span>
    <span class="build-date">{{ buildDate }}</span>
    <div v-if="showDetails" class="version-details">
      <div class="detail-item">
        <span class="detail-label">Build:</span>
        <span class="detail-value">{{ buildTime }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Environment:</span>
        <span class="detail-value">{{ environment }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">API:</span>
        <span class="detail-value">{{ apiUrl }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VersionInfo',
  data() {
    return {
      version: '1.0.0',
      showDetails: false,
      buildDate: this.getBuildDate(),
      buildTime: this.getBuildTime(),
      environment: this.getEnvironment(),
      apiUrl: this.getApiUrl()
    }
  },
  methods: {
    getBuildDate() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    getBuildTime() {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    },
    getEnvironment() {
      return import.meta.env.MODE || 'production'
    },
    getApiUrl() {
      return import.meta.env.VITE_API_URL || window.location.origin
    },
    toggleDetails() {
      this.showDetails = !this.showDetails
    }
  }
}
</script>

<style scoped>
.version-info {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #888;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 200px;
}

.version-text {
  font-weight: bold;
  color: #aaa;
}

.build-date {
  font-size: 10px;
  color: #666;
}

.version-details {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
  font-size: 10px;
}

.detail-label {
  color: #777;
  margin-right: 8px;
}

.detail-value {
  color: #999;
  font-family: 'Courier New', monospace;
  word-break: break-all;
}

/* Hover-Effekt für bessere Sichtbarkeit */
.version-info:hover {
  background: rgba(0, 0, 0, 0.9);
  color: #ccc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.version-info:hover .version-text {
  color: #fff;
}

.version-info:hover .build-date {
  color: #aaa;
}

.version-info:hover .detail-value {
  color: #ccc;
}

/* Animation für Details */
.version-details {
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
