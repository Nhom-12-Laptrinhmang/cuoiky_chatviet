#!/usr/bin/env python3
"""
Script để xem dữ liệu trong database
Chạy: python3 view_db.py
"""

import sqlite3
import sys

def view_database(table_name=None, limit=5):
    """
    Xem dữ liệu trong database
    
    Args:
        table_name: Tên bảng (nếu None thì xem tất cả bảng)
        limit: Số dòng tối đa để hiển thị
    """
    db_path = 'storage/chatapp.db'
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Lấy danh sách tất cả bảng
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall()]
    
    print("\n" + "=" * 100)
    print("📊 DỮ LIỆU DATABASE - Vietnam Chat")
    print("=" * 100)
    
    # Nếu chỉ định bảng cụ thể
    if table_name:
        if table_name not in tables:
            print(f"❌ Bảng '{table_name}' không tồn tại!")
            print(f"Bảng có sẵn: {', '.join(tables)}")
            conn.close()
            return
        tables = [table_name]
    
    for tbl in tables:
        cursor.execute(f"SELECT COUNT(*) FROM [{tbl}]")
        count = cursor.fetchone()[0]
        
        print(f"\n{'='*100}")
        print(f"📋 Bảng: {tbl.upper()} ({count} dòng)")
        print(f"{'='*100}")
        
        cursor.execute(f"SELECT * FROM [{tbl}] LIMIT {limit}")
        rows = cursor.fetchall()
        
        if rows:
            columns = [description[0] for description in cursor.description]
            print(f"Cột: {', '.join(columns)}")
            print("-" * 100)
            
            for i, row in enumerate(rows, 1):
                row_dict = dict(row)
                print(f"\nDòng {i}:")
                for key, val in row_dict.items():
                    if val is None:
                        val_str = "None"
                    else:
                        val_str = str(val)[:70] + "..." if len(str(val)) > 70 else str(val)
                    print(f"  {key}: {val_str}")
        else:
            print("  (không có dữ liệu)")
    
    conn.close()
    print("\n" + "=" * 100 + "\n")

def get_stats():
    """Xem thống kê database"""
    db_path = 'storage/chatapp.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall()]
    
    print("\n" + "=" * 60)
    print("📊 THỐNG KÊ DATABASE")
    print("=" * 60)
    
    total_rows = 0
    for tbl in tables:
        cursor.execute(f"SELECT COUNT(*) FROM [{tbl}]")
        count = cursor.fetchone()[0]
        total_rows += count
        print(f"{tbl:20} {count:5} dòng")
    
    print("-" * 60)
    print(f"{'TỔNG CỘNG':20} {total_rows:5} dòng")
    print("=" * 60 + "\n")
    
    conn.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--stats":
            get_stats()
        else:
            table = sys.argv[1]
            limit = int(sys.argv[2]) if len(sys.argv) > 2 else 5
            view_database(table, limit)
    else:
        view_database()
