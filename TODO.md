BUGS:
1. When deleting ANYTHING an error message pops up of Unexpected end of JSON input, and the page doesn't get refreshed with the deleted supplier/תקלה instantly, I need to refresh to see the changes
2. The calender arrows need to be inverted
3. The calender gets cut in the middle and I can't scroll down, make the calander smaller and more compact (See calander_cut.png, delete afterwards)
4. When creating a תקלה, add an option in the form to add missions as actions as well (and link them to missions)
5. When adding new things (missions, actions, etc...), I want that the page will be refreshed with the new item immediatly on event creation
6. I want the telegram bot to present a set of actions it is capable to do (lets discuss about it, I don't want to bloat), maybe by typing /help it should present a list of its usages
7. I asked the bot to edit the פרטי התקשרות of בדיקה טלרגם to בדיקה בדיקה בדיקה, but instead of changing it in the existing client, it created a new one (see sapakim_bug.png)
8. We should not allow duplicate clients, in case of duplicate clients (Simple comparison by name), it should present an error message of "ספק כבר קיים במערכת"
9. Create a logs folder for debugging and insert logs from the server with possible failure points, supress all messages that are unrelated to the main app
10. I asked the bot to delete the two suppliers called בדיקה טלרגם but instead it just created two of them again, it seems it doesn't have a deletion tool
11. It doesn't let me delete suppliers with linked תקלות, even if the תקלה status is DONE, it should not prevent me from deleting a supplier
12. See what I asked the bot and the result in screenshots telegram_conv.png and takala.png, this is wrong, also he assumed the urgency to be high, I want him to ask for clarification in case he needs it for details, for example the שם מוצר also should be asked as this is a field that must be entered, and for a due date for the task in case not specified