# מדריך התקנה מלא ל-VPS - TaskBoss-AI

<div dir="rtl">

## שלב 1: העלאת הקוד ל-GitHub

### 1.1 יצירת Repository חדש ב-GitHub
1. היכנס ל-GitHub.com
2. לחץ על "New Repository"
3. בחר שם לפרויקט (לדוגמה: `taskboss-ai`)
4. לחץ על "Create repository"

### 1.2 העלאת הקוד המקומי
```bash
# בתיקיית הפרויקט המקומי שלך
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskboss-ai.git
git push -u origin main
```

## שלב 2: הכנת ה-VPS

### 2.1 התחברות ל-VPS
```bash
ssh root@YOUR_VPS_IP
```
הזן את הסיסמה שקיבלת מ-Hostinger

### 2.2 עדכון המערכת
```bash
apt update && apt upgrade -y
```

### 2.3 התקנת Node.js
```bash
# התקנת Node.js גרסה 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# בדיקה שההתקנה הצליחה
node --version
npm --version
```

### 2.4 התקנת Git
```bash
apt install -y git
```

### 2.5 התקנת PM2 (לניהול תהליכים)
```bash
npm install -g pm2
```

## שלב 3: העתקת הפרויקט מ-GitHub

### 3.1 יצירת תיקיית עבודה
```bash
mkdir -p /var/www
cd /var/www
```

### 3.2 שכפול הפרויקט
```bash
git clone https://github.com/YOUR_USERNAME/taskboss-ai.git
cd taskboss-ai
```

### 3.3 התקנת התלויות
```bash
npm install
```

## שלב 4: הגדרת משתני סביבה

### 4.1 יצירת קובץ .env
```bash
nano .env
```

### 4.2 הוספת מפתח OpenAI
הוסף את השורה הבאה (החלף את המפתח):
```
OPENAI_API_KEY=your_actual_openai_key_here
```

שמור וצא: `Ctrl + X`, לאחר מכן `Y`, לאחר מכן `Enter`

## שלב 5: הפעלת האפליקציה

### 5.1 בדיקה ראשונית
```bash
# בדיקה שהאפליקציה פועלת
node server.js
```
אם הכל עובד, תראה: `Server listening at http://localhost:3001`
עצור את הבדיקה: `Ctrl + C`

### 5.2 הפעלה עם PM2
```bash
pm2 start server.js --name "taskboss-ai"
```

### 5.3 הגדרת הפעלה אוטומטית
```bash
pm2 startup
pm2 save
```

## שלב 6: בדיקת הפעלה

### 6.1 בדיקת סטטוס
```bash
pm2 status
pm2 logs taskboss-ai
```

### 6.2 בדיקת חיבור
הפתח דפדפן וגש ל: `http://YOUR_VPS_IP:3001`

## שלב 7: הגדרת חומת אש (אופציונלי)

### 7.1 הפעלת UFW
```bash
ufw enable
ufw allow 22    # SSH
ufw allow 3001  # האפליקציה
ufw allow 80    # HTTP (אם תרצה nginx)
ufw allow 443   # HTTPS (אם תרצה nginx)
```

## שלב 8: פקודות שימושיות

### 8.1 ניהול האפליקציה
```bash
# הפעלה מחדש
pm2 restart taskboss-ai

# עצירה
pm2 stop taskboss-ai

# הפעלה
pm2 start taskboss-ai

# צפייה בלוגים
pm2 logs taskboss-ai

# סטטוס
pm2 status
```

### 8.2 עדכון הקוד
```bash
cd /var/www/taskboss-ai
git pull origin main
npm install  # אם יש תלויות חדשות
pm2 restart taskboss-ai
```

## שלב 9: פתרון בעיות נפוצות

### 9.1 בעיית הרשאות
```bash
chown -R root:root /var/www/taskboss-ai
chmod -R 755 /var/www/taskboss-ai
```

### 9.2 בדיקת פורטים
```bash
netstat -tulpn | grep :3001
```

### 9.3 צפייה בשגיאות
```bash
pm2 logs taskboss-ai --lines 50
```

## שלב 10: אבטחה בסיסית

### 10.1 שינוי פורט SSH (מומלץ)
```bash
nano /etc/ssh/sshd_config
# שנה את Port 22 לפורט אחר
systemctl restart ssh
```

### 10.2 יצירת משתמש לא-root
```bash
adduser deploy
usermod -aG sudo deploy
```

## גישה לאפליקציה

כעת האפליקציה שלך פועלת ב:
- `http://YOUR_VPS_IP:3001`

## הערות חשובות

1. **גיבוי**: שמור על גיבוי של קובץ ה-.env
2. **מפתח OpenAI**: אל תשתף את המפתח בקוד
3. **עדכונים**: הרץ עדכונים בקביעות
4. **מוניטורינג**: בדוק את הלוגים בקביעות

---

**בהצלחה! 🚀**

לשאלות נוספות או בעיות, בדוק את הלוגים או פנה לתמיכה.

</div>