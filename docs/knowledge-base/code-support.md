# Hướng Dẫn Hỗ Trợ Code - FPT University

## 1. Lỗi Thường Gặp - Java

### NullPointerException
**Nguyên nhân:** Truy cập vào đối tượng null

```java
// SAI
String name = null;
System.out.println(name.length()); // NullPointerException

// ĐÚNG
String name = null;
if (name != null) {
    System.out.println(name.length());
}
// Hoặc dùng Optional (Java 8+)
Optional.ofNullable(name).ifPresent(n -> System.out.println(n.length()));
```

### ArrayIndexOutOfBoundsException
**Nguyên nhân:** Truy cập index không tồn tại trong array

```java
// SAI
int[] numbers = {1, 2, 3};
System.out.println(numbers[3]); // Lỗi: index 3 không tồn tại

// ĐÚNG
int[] numbers = {1, 2, 3};
if (3 < numbers.length) {
    System.out.println(numbers[3]);
}
```

### ClassCastException
**Nguyên nhân:** Ép kiểu không hợp lệ

```java
// SAI
Object obj = "Hello";
Integer num = (Integer) obj; // Lỗi: String không cast được thành Integer

// ĐÚNG
Object obj = "Hello";
if (obj instanceof Integer) {
    Integer num = (Integer) obj;
}
```

## 2. Database Connection - Java

### Kết nối MySQL với JDBC

```java
// 1. Thêm MySQL Connector vào project (Maven)
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.33</version>
</dependency>

// 2. Code kết nối
import java.sql.*;

public class DatabaseConnection {
    private static final String URL = "jdbc:mysql://localhost:3306/your_database";
    private static final String USER = "root";
    private static final String PASSWORD = "your_password";
    
    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            return DriverManager.getConnection(URL, USER, PASSWORD);
        } catch (ClassNotFoundException e) {
            throw new SQLException("MySQL Driver not found", e);
        }
    }
    
    // Sử dụng
    public static void main(String[] args) {
        try (Connection conn = getConnection()) {
            System.out.println("Connected to database!");
            
            // Execute query
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM users");
            
            while (rs.next()) {
                System.out.println("User: " + rs.getString("name"));
            }
        } catch (SQLException e) {
            System.err.println("Connection failed: " + e.getMessage());
        }
    }
}
```

### Lỗi thường gặp với Database

**1. Communications link failure**
```
Nguyên nhân: MySQL server chưa chạy hoặc sai port
Giải pháp:
- Kiểm tra MySQL đã chạy chưa (MySQL Workbench)
- Kiểm tra port (mặc định: 3306)
- Kiểm tra firewall
```

**2. Access denied for user**
```
Nguyên nhân: Sai username/password
Giải pháp:
- Kiểm tra lại username và password
- Reset password nếu cần: ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
```

## 3. Java Web - JSP/Servlet

### Servlet cơ bản

```java
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.io.IOException;

@WebServlet("/hello")
public class HelloServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        // Lấy parameter từ URL
        String name = request.getParameter("name");
        
        // Set attribute cho JSP
        request.setAttribute("greeting", "Hello " + name);
        
        // Forward đến JSP
        request.getRequestDispatcher("/WEB-INF/views/hello.jsp")
               .forward(request, response);
    }
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        // Lấy data từ form
        String username = request.getParameter("username");
        String password = request.getParameter("password");
        
        // Process login...
        if (isValidUser(username, password)) {
            HttpSession session = request.getSession();
            session.setAttribute("user", username);
            response.sendRedirect("dashboard.jsp");
        } else {
            request.setAttribute("error", "Invalid credentials");
            request.getRequestDispatcher("/login.jsp").forward(request, response);
        }
    }
    
    private boolean isValidUser(String username, String password) {
        // TODO: Check database
        return true;
    }
}
```

### JSP Page

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<!DOCTYPE html>
<html>
<head>
    <title>Hello Page</title>
</head>
<body>
    <h1>${greeting}</h1>
    
    <!-- Form -->
    <form action="hello" method="post">
        <input type="text" name="username" placeholder="Username" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Login</button>
    </form>
    
    <!-- Error message -->
    <c:if test="${not empty error}">
        <p style="color: red;">${error}</p>
    </c:if>
    
    <!-- Loop -->
    <c:forEach var="item" items="${items}">
        <p>${item.name}</p>
    </c:forEach>
</body>
</html>
```

## 4. JavaScript/React

### Fetch API - Call Backend

```javascript
// GET request
async function getUsers() {
    try {
        const response = await fetch('http://localhost:8080/api/users');
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// POST request
async function createUser(userData) {
    try {
        const response = await fetch('http://localhost:8080/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create user');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating user:', error);
    }
}

// Usage
getUsers().then(users => {
    console.log('Users:', users);
});

createUser({ name: 'John', email: 'john@example.com' });
```

### React Component

```javascript
import React, { useState, useEffect } from 'react';

function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        fetchUsers();
    }, []);
    
    async function fetchUsers() {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            setUsers(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
        <div>
            <h1>Users</h1>
            <ul>
                {users.map(user => (
                    <li key={user.id}>{user.name}</li>
                ))}
            </ul>
        </div>
    );
}

export default UserList;
```

## 5. Git và GitHub

### Quy trình làm việc cơ bản

```bash
# 1. Clone repository
git clone https://github.com/username/project.git
cd project

# 2. Tạo branch mới
git checkout -b feature/my-feature

# 3. Làm việc và commit
git add .
git commit -m "Add new feature"

# 4. Push lên GitHub
git push origin feature/my-feature

# 5. Tạo Pull Request trên GitHub

# 6. Merge vào main (sau khi được approve)

# 7. Update local main
git checkout main
git pull origin main

# 8. Xóa branch đã merge
git branch -d feature/my-feature
```

### Lỗi Git thường gặp

**1. Merge conflict**
```bash
# Xem files bị conflict
git status

# Sửa conflict trong file, sau đó:
git add .
git commit -m "Resolve merge conflict"
git push
```

**2. Commit nhầm**
```bash
# Undo commit gần nhất (giữ changes)
git reset --soft HEAD~1

# Undo commit và xóa changes
git reset --hard HEAD~1
```

**3. Push bị reject**
```bash
# Pull trước khi push
git pull origin main
# Giải quyết conflict nếu có
git push origin main
```

## 6. Maven Project Setup

### pom.xml cơ bản

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.fpt.edu</groupId>
    <artifactId>my-project</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>war</packaging>
    
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
    </properties>
    
    <dependencies>
        <!-- Servlet API -->
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>javax.servlet-api</artifactId>
            <version>4.0.1</version>
            <scope>provided</scope>
        </dependency>
        
        <!-- MySQL Connector -->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.33</version>
        </dependency>
        
        <!-- JSTL -->
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>jstl</artifactId>
            <version>1.2</version>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-war-plugin</artifactId>
                <version>3.3.2</version>
            </plugin>
        </plugins>
    </build>
</project>
```

## 7. Debugging Tips

### NetBeans Debugging
1. **Set breakpoint**: Click vào số dòng bên trái
2. **Debug project**: F5
3. **Step Over**: F8
4. **Step Into**: F7
5. **Continue**: F5
6. **Watch variable**: Right-click variable → Add Watch

### System.out.println() Strategic
```java
// Kiểm tra giá trị variable
System.out.println("DEBUG: username = " + username);

// Kiểm tra flow
System.out.println("DEBUG: Entering method doPost");

// Kiểm tra condition
System.out.println("DEBUG: isValid = " + isValid);

// JSON format (dễ đọc)
System.out.println("DEBUG: user = " + new Gson().toJson(user));
```

## 8. Testing

### JUnit Test

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class UserServiceTest {
    
    @Test
    public void testValidLogin() {
        UserService service = new UserService();
        boolean result = service.login("admin", "admin123");
        assertTrue(result, "Login should succeed with valid credentials");
    }
    
    @Test
    public void testInvalidLogin() {
        UserService service = new UserService();
        boolean result = service.login("admin", "wrong");
        assertFalse(result, "Login should fail with invalid credentials");
    }
    
    @Test
    public void testNullUsername() {
        UserService service = new UserService();
        assertThrows(IllegalArgumentException.class, () -> {
            service.login(null, "password");
        });
    }
}
```

---

*Nếu gặp lỗi không có trong tài liệu này, vui lòng tạo ticket trên EduTicket AI để được hỗ trợ trực tiếp.*
*Nhớ đính kèm: Code, error message, và các bước đã thử.*

