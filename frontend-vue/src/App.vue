<template>
  <div id="app">
    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>
    <VersionInfo />
  </div>
</template>

<script>
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import VersionInfo from '@/components/VersionInfo.vue'

export default {
  name: 'App',
  components: {
    ErrorBoundary,
    VersionInfo
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #e0e0e0;
  height: 100vh;
  margin: 0;
  padding: 0;
  background: #1a1a1a;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  height: 100vh;
  overflow: hidden;
  background: #1a1a1a;
  color: #e0e0e0;
}
</style>

