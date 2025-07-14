# TaskBoss-AI - VPS Setup Guide

## תיקונים שבוצעו

### בעיות שתוקנו:
1. **תיקון nginx configuration** - הוסרה שגיאת התחביר `must-revalidate auth` ל-`must-revalidate`
2. **תיקון PM2 ecosystem file** - שונה מ-`.js` ל-`.cjs` לתאימות CommonJS
3. **הוספת health endpoint** - נוסף `/api/health` לבדיקת בריאות השרת
4. **שיפור בדיקות setup** - נוספו בדיקות מקיפות יותר לקיום קבצים
5. **שיפור error handling** - נוספו בדיקות שגיאות מתקדמות

## קבצי Setup מתוקנים:

### 1. setup-root.sh (עבור root user)
- תיקון nginx gzip_proxied configuration
- שינוי ecosystem.config.js ל-ecosystem.config.cjs
- הוספת בדיקות קיום קבצים
- שיפור error handling
- הוספת בדיקות health מתקדמות

### 2. server/server.js
- הוספת health endpoint: `/api/health`
- מחזיר מידע על סטטוס השרת ומסד הנתונים

### 3. run.sh (מתוקן)
- תיקון הפניה ל-ecosystem.config.cjs
- שיפור בדיקות setup
- הוספת retry logic לבדיקת health
- בדיקות מתקדמות יותר

### 4. start-simple.sh (חדש)
- סקריפט הרצה פשוט לשימוש יומיומי
- בדיקות מהירות
- הרצה קלה אחרי setup ראשוני

## הוראות שימוש:

### התקנה ראשונית (על השרת):
```bash
# 1. העתק את הקבצים לשרת
git clone [repository-url]
cd TaskBoss-AI

# 2. הפוך את הסקריפטים לניתנים להרצה
chmod +x setup-root.sh run.sh start-simple.sh stop.sh status.sh

# 3. הרץ את ההתקנה המלאה (כ-root)
sudo ./setup-root.sh
```

### הרצה יומיומית:
```bash
# הרצה מהירה (אחרי setup ראשוני)
./start-simple.sh

# או הרצה מלאה עם בדיקות
./run.sh

# עצירת השרתים
./stop.sh

# בדיקת סטטוס
./status.sh
```

### בדיקות בריאות:
```bash
# בדיקת health endpoint
curl http://localhost:3001/api/health

# בדיקת frontend
curl http://localhost

# בדיקת PM2 status
pm2 list

# בדיקת nginx status
systemctl status nginx

# צפייה בלוגים
pm2 logs taskboss-ai
```

## פתרון בעיות נפוצות:

### 1. שגיאת nginx configuration:
```bash
# בדיקת תחביר nginx
sudo nginx -t

# אם יש שגיאה, בדוק את הקובץ:
sudo nano /etc/nginx/sites-available/taskboss-ai
```

### 2. בעיות PM2:
```bash
# הפעלה מחדש של PM2
pm2 restart taskboss-ai

# מחיקה והפעלה מחדש
pm2 delete taskboss-ai
pm2 start ecosystem.config.cjs

# צפייה בלוגים
pm2 logs taskboss-ai --lines 50
```

### 3. בעיות מסד נתונים:
```bash
# בדיקת קיום מסד הנתונים
ls -la /var/www/taskboss-ai/server/taskboss.db

# יצירת מסד נתונים חדש (אם נדרש)
cd /var/www/taskboss-ai/server
node create-new-db.js
```

### 4. בעיות ports:
```bash
# בדיקת מי משתמש בפורט
netstat -tlnp | grep :3001
lsof -i :3001

# הרג תהליכים תקועים
pkill -f "node"
```

## קבצי תצורה חשובים:

- **Application**: `/var/www/taskboss-ai/`
- **Nginx config**: `/etc/nginx/sites-available/taskboss-ai`
- **Environment**: `/var/www/taskboss-ai/.env`
- **Database**: `/var/www/taskboss-ai/server/taskboss.db`
- **PM2 Config**: `/var/www/taskboss-ai/ecosystem.config.cjs`
- **Logs**: `/var/www/taskboss-ai/logs/`

## URLs:
- **Frontend**: `http://your-domain.com`
- **Backend API**: `http://your-domain.com/api`
- **Health Check**: `http://your-domain.com/api/health`

## פקודות שימושיות:
```bash
# הפעלה מחדש של nginx
sudo systemctl reload nginx

# צפייה בלוגי nginx
sudo tail -f /var/log/nginx/error.log

# בדיקת דיסק
df -h

# בדיקת זיכרון
free -h

# בדיקת תהליכים
htop
```

הסקריפטים המתוקנים אמורים לפתור את הבעיות שהיו בהתקנה המקורית ולספק חוויית setup וhרצה יציבה יותר.