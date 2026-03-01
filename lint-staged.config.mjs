export default {
  '(apps|libs|packages)/**/*.{js,ts,jsx,tsx}': (files) => {
    // 排除 coverage 目录中的自动生成文件
    const filteredFiles = files.filter(
      (file) => !file.includes('/coverage/') && !file.includes('\\coverage\\')
    );
    if (filteredFiles.length === 0) return 'echo "No files to lint"';
    return `biome lint --reporter summary --config-path=biome-staged.json ${filteredFiles.join(' ')}`;
  },
};
