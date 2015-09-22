#!/usr/bin/python

from .. import mysqlUtil, util

requiredParameters = ["userId", "itemId", "value", "originalUser"]

def execute(fieldStorage):
	userId = fieldStorage["userId"].value
	itemId = fieldStorage["itemId"].value
	value = fieldStorage["value"].value
	ip = fieldStorage.ip
	originalUser = fieldStorage["originalUser"].value

	result = piikkaus(userId, itemId, value, ip, originalUser)
	
	return {"success": result == "ok", "message": result}



#Validate and do piikkaus
def piikkaus(userId, itemId, value, ip, originalUser):
	userId = int(userId)
	itemId = int(itemId)
	value = int(value)
	ip = str(ip)
	originalUser = str(originalUser).replace('"', '').replace("'", '')

	if value < 0 and not canUndoPiikkaus(userId, itemId):
		return "Can't do two negative pikkaus a row."


	if value >= -1 and value <= 10 and value is not 0:
		con = mysqlUtil.getConnection()

		if con is None: return "invalid connection"

		if mysqlUtil.isValidUserId(userId, con):
			if mysqlUtil.isValidItemId(itemId, con):
				ret = piikkausImpl(userId, itemId, value, ip, originalUser, con)
				t = util.Timer("commit")
				con.commit()
				t.write();
				con.close()
				return ret
			else:
				con.close()
				return "invalid itemId: " + str(itemId)
		else:
			con.close()
			return "invalid userId: " + str(userId)

		con.close()

	else:
		return "invalid value: " + str(value)



"""
select price from items where id=1;
insert into piikkaukset (userId, itemId, value, price, date, ip) VALUES(1, 1, 1, (select price from items where id=1), NOW(), '123');
"""

#Piikkaus without validation
def piikkausImpl(userId, itemId, value, ip, originalUser, con):
	priceQuery = "(select price*"+str(value)+" from items where id="+str(itemId)+")"
	sql = "insert into piikkaukset (userId, itemId, value, price, date, ip, originalUser) VALUES("+str(userId)+", "+str(itemId)+", "+str(value)+", "+priceQuery+", NOW(), '"+str(ip)+"', '"+str(originalUser)+"');"
	cur = con.cursor()
	ret = cur.execute(sql)
	cur.close()

	if ret > 0:
		return "ok"
	else:
		return "error while inserting piikkaus"

def canUndoPiikkaus(userId, itemId):
	userId = int(userId)
	itemId = int(itemId)

	sql = "select value from piikkaukset where userId="+str(userId)+" and itemId="+str(itemId)+" order by orderId desc limit 1;"
	con = mysqlUtil.getConnection()
	if con:
		cur = con.cursor()
		cur.execute(sql)
		rows = cur.fetchall()
		cur.close()
		con.close()

		if len(rows) == 0:
			return False

		return int(rows[0][0]) > 0
	else:
		return True
