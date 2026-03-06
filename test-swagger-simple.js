const fs = require('fs');
const path = require('path');

// 读取编译后的 app.module.js 文件
const appModulePath = path.join(__dirname, 'dist/src/app.module.js');
const content = fs.readFileSync(appModulePath, 'utf8');

// 检查是否包含 @ApiExtraModels 装饰器
const hasApiExtraModels = content.includes('@ApiExtraModels');

console.log('✅ 编译后的文件存在');
console.log('包含 @ApiExtraModels:', hasApiExtraModels);

// 检查是否导入了 DTO
const hasDtoImports = content.includes('WebhookResponse') && content.includes('ApiKeyResponse');

console.log('包含 DTO 导入:', hasDtoImports);

// 检查具体的装饰器内容
const match = content.match(/@ApiExtraModels\(([^)]+)\)/);
if (match) {
  console.log('@ApiExtraModels 内容:', match[1]);
} else {
  console.log('❌ 没有找到 @ApiExtraModels 装饰器内容');
}
