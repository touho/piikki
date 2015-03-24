#!/usr/bin/python

from .. import mysqlUtil, util

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
		t = util.Timer("make mysql connection")
		con = mysqlUtil.getConnection()
		t.write();

		if con is None: return "invalid connection"

		t = util.Timer("is valid user id")
		if mysqlUtil.isValidUserId(userId, con):
			t.write();
			t = util.Timer("is valid item id")
			if mysqlUtil.isValidItemId(itemId, con):
				t.write();
				t = util.Timer("piikkaus impl")
				ret = piikkausImpl(userId, itemId, value, ip, con)
				t.write();
				t = util.Timer("close connection")
				con.commit()
				con.close()
				t.write();
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
def piikkausImpl(userId, itemId, value, ip, con):
	priceQuery = "(select price*"+str(value)+" from items where id="+str(itemId)+")"
	sql = "insert into piikkaukset (userId, itemId, value, price, date, ip) VALUES("+str(userId)+", "+str(itemId)+", "+str(value)+", "+priceQuery+", NOW(), '"+str(ip)+"');"
	cur = con.cursor()
	ret = cur.execute(sql)
	cur.close()

	if ret > 0:
		return "ok"
	else:
		return "error while inserting piikkaus"
