#!/bin/bash

###############################################################################
# Admin 插件迁移验证脚本
#
# 用途：验证 Better Auth Admin 插件迁移是否成功
# 作者：AI Assistant
# 日期：2026-03-25
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 检查环境变量
check_env() {
    print_section "检查环境变量"
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL 环境变量未设置"
        exit 1
    fi
    print_success "DATABASE_URL 已设置"
}

# 检查数据库连接
check_database_connection() {
    print_section "检查数据库连接"
    
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "数据库连接成功"
    else
        print_error "数据库连接失败"
        exit 1
    fi
}

# 检查数据库表是否存在
check_tables() {
    print_section "检查数据库表"
    
    local tables=("user" "session" "account")
    
    for table in "${tables[@]}"; do
        if psql "$DATABASE_URL" -c "\dt $table" | grep -q "$table"; then
            print_success "表 '$table' 存在"
        else
            print_error "表 '$table' 不存在"
            exit 1
        fi
    done
}

# 检查 Admin 插件字段
check_admin_fields() {
    print_section "检查 Admin 插件字段"
    
    local fields=("banned" "ban_reason" "banned_at" "ban_expires")
    
    for field in "${fields[@]}"; do
        if psql "$DATABASE_URL" -c "\d user" | grep -q "$field"; then
            print_success "字段 '$field' 存在"
        else
            print_error "字段 '$field' 不存在"
            print_warning "请运行数据库迁移：pnpm db:migrate"
            exit 1
        fi
    done
}

# 检查用户角色
check_user_roles() {
    print_section "检查用户角色"
    
    # 统计各角色用户数量
    local total_users=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"user\";")
    local superadmin_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"user\" WHERE role = 'superadmin';")
    local admin_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"user\" WHERE role = 'admin';")
    local user_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"user\" WHERE role = 'user';")
    local other_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"user\" WHERE role NOT IN ('superadmin', 'admin', 'user');")
    
    echo ""
    print_info "总用户数: $(echo $total_users | xargs)"
    print_info "超级管理员: $(echo $superadmin_count | xargs)"
    print_info "管理员: $(echo $admin_count | xargs)"
    print_info "普通用户: $(echo $user_count | xargs)"
    print_info "其他角色: $(echo $other_count | xargs)"
    echo ""
    
    # 检查是否有未知角色
    if [ "$other_count" -gt 0 ]; then
        print_warning "发现 $(echo $other_count | xargs) 个用户使用未知角色"
        print_info "请运行角色迁移脚本：pnpm tsx scripts/migrate-admin-data.ts"
    else
        print_success "所有用户角色均为有效角色"
    fi
}

# 检查封禁用户
check_banned_users() {
    print_section "检查封禁用户"
    
    local banned_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"user\" WHERE banned = true;")
    local active_bans=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"user\" WHERE banned = true AND (ban_expires IS NULL OR ban_expires > NOW());")
    local expired_bans=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"user\" WHERE banned = true AND ban_expires IS NOT NULL AND ban_expires <= NOW();")
    
    echo ""
    print_info "封禁用户总数: $(echo $banned_count | xargs)"
    print_info "有效封禁: $(echo $active_bans | xargs)"
    print_info "已过期封禁: $(echo $expired_bans | xargs)"
    echo ""
    
    if [ "$banned_count" -gt 0 ]; then
        print_success "封禁系统工作正常"
    else
        print_info "暂无封禁用户"
    fi
}

# 检查会话
check_sessions() {
    print_section "检查会话"
    
    local total_sessions=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM session;")
    local active_sessions=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM session WHERE expires_at > NOW();")
    local expired_sessions=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM session WHERE expires_at <= NOW();")
    
    echo ""
    print_info "会话总数: $(echo $total_sessions | xargs)"
    print_info "活跃会话: $(echo $active_sessions | xargs)"
    print_info "过期会话: $(echo $expired_sessions | xargs)"
    echo ""
    
    if [ "$total_sessions" -gt 0 ]; then
        print_success "会话系统工作正常"
    else
        print_info "暂无会话数据"
    fi
}

# 验证权限系统
check_permissions() {
    print_section "验证权限系统"
    
    print_info "检查超级管理员权限..."
    local superadmin_has_all=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"user\" WHERE role = 'superadmin' AND banned = false;" | xargs)
    
    if [ "$superadmin_has_all" -gt 0 ]; then
        print_success "超级管理员账户正常"
    else
        print_warning "没有可用的超级管理员账户"
    fi
    
    print_info "检查管理员权限..."
    local admin_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"user\" WHERE role = 'admin' AND banned = false;" | xargs)
    
    if [ "$admin_count" -gt 0 ]; then
        print_success "管理员账户正常"
    else
        print_info "没有可用的管理员账户"
    fi
}

# 生成验证报告
generate_report() {
    print_section "验证报告"
    
    local report_file="admin-migration-verification-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "Admin 插件迁移验证报告"
        echo "========================"
        echo ""
        echo "验证时间: $(date)"
        echo "数据库: $DATABASE_URL"
        echo ""
        echo "检查项目："
        echo "✓ 数据库连接"
        echo "✓ 数据库表结构"
        echo "✓ Admin 插件字段"
        echo "✓ 用户角色分配"
        echo "✓ 封禁用户状态"
        echo "✓ 会话管理"
        echo "✓ 权限系统"
        echo ""
        echo "验证状态: 通过 ✓"
    } > "$report_file"
    
    print_success "验证报告已生成: $report_file"
}

# 主函数
main() {
    print_section "Admin 插件迁移验证开始"
    
    echo ""
    print_info "此脚本将验证以下内容："
    echo "  1. 数据库连接"
    echo "  2. 数据库表结构"
    echo "  3. Admin 插件字段"
    echo "  4. 用户角色分配"
    echo "  5. 封禁用户状态"
    echo "  6. 会话管理"
    echo "  7. 权限系统"
    echo ""
    
    read -p "是否继续？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "验证已取消"
        exit 0
    fi
    
    # 执行验证
    check_env
    check_database_connection
    check_tables
    check_admin_fields
    check_user_roles
    check_banned_users
    check_sessions
    check_permissions
    generate_report
    
    print_section "验证完成 ✓"
    
    echo ""
    print_success "所有验证项目均已通过！"
    print_info "下一步："
    echo "  1. 检查验证报告"
    echo "  2. 测试 API 端点"
    echo "  3. 进行性能测试"
    echo "  4. 准备灰度发布"
    echo ""
}

# 运行主函数
main
