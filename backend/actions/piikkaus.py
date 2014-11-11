#!/usr/bin/python

from .. import mysqlUtil

requiredParameters = ["userId", "itemId", "value"]

def execute(fieldStorage):
	userId = fieldStorage["userId"].value
	itemId = fieldStorage["itemId"].value
	value = fieldStorage["value"].value
	ip = fieldStorage.ip

	result = piikkaus(userId, itemId, value, ip)
	
	return {"success": result == "ok", "message": result}



#Validate and do piikkaus
def piikkaus(userId, itemId, value, ip):
	userId = int(userId)
	itemId = int(itemId)
	value = int(value)
	ip = str(ip)

	if value > -100 and value < 100 and value is not 0:
		con = mysqlUtil.getConnection()
		if con is None: return "invalid connection"

		if mysqlUtil.isValidUserId(userId, con):
			if mysqlUtil.isValidItemId(itemId, con):
				ret = piikkausImpl(userId, itemId, value, ip, con)
				con.commit()
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
		return "invalid value: " + value

#Piikkaus without validation
def piikkausImpl(userId, itemId, value, ip, con):
	sql = "insert into piikkaukset (userId, itemId, value, date, ip) VALUES("+str(userId)+", "+str(itemId)+", "+str(value)+", NOW(), '"+str(ip)+"');"
	cur = con.cursor()
	ret = cur.execute(sql)
	cur.close()

	if ret > 0:
		return "ok"
	else:
		return "error while inserting piikkaus"
