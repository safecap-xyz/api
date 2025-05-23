module.exports = {
  hooks: {
    readPackage(pkg) {
      // Skip onnxruntime-node postinstall script that downloads binaries
      if (pkg.name === 'onnxruntime-node') {
        delete pkg.scripts.postinstall;
        console.log('Skipping onnxruntime-node postinstall script');
      }
      return pkg;
    }
  }
};
