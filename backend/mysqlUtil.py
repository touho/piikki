#!/usr/bin/python
# -*- coding: utf-8 -*-

from backend import config
import util, sys

import MySQLdb

def getConnection():
	try:
		# url, user, pass, db
		t = util.Timer("Connect to MySQL")
		con = MySQLdb.connect(config.db_host, config.db_user, config.db_pass, config.db_database)
		t.write()
	except Exception as e:
		#print sys.exc_info()[0], str(e) # This gives more info if needed
		return None
	return con


def commitSQLCommand(sql):
	con = getConnection()
	if con:
		cur = con.cursor()
		num = cur.execute(sql)
		cur.close()
		con.commit()
		con.close()
		return num
	return 0

def fetchWithSQLCommand(sql):
	con = getConnection()
	if con:
		cur = con.cursor()
		cur.execute(sql)
		ret = cur.fetchall()
		cur.close()
		con.close()
		return ret
	return None

def dropTables():
	return commitSQLCommand("drop table IF EXISTS users, items, piikkaukset, payments;");


def createTables():
	con = getConnection()
	if con:
		createUsersTable = """create table if not exists users (
			id int not null auto_increment, 
			name varchar(255) not null, 
			email varchar(255), 
			isAdmin boolean,
			password varchar(255),
			primary key (id) );"""
		
		createItemsTable = """create table if not exists items (
			id int not null auto_increment, 
			name varchar(255) not null, 
			price float,
			visible boolean,
			primary key (id) );"""

		createPiikkauksetTable = """create table if not exists piikkaukset (
			orderId int not null auto_increment,
			userId int not null, 
			itemId int not null,
			value int,
			price float,
			date datetime,
			ip varchar(127),
			originalUser varchar(127),
			primary key (orderId));"""

		createPaymentsTable = """create table if not exists payments (
			orderId int not null auto_increment,
			userId int not null, 
			value float,
			date date,
			primary key (orderId));"""

		cur = con.cursor()
		cur.execute(createUsersTable)
		cur.execute(createItemsTable)
		cur.execute(createPiikkauksetTable)
		cur.execute(createPaymentsTable)
		cur.close()
		con.commit()
		con.close()

def resetPiikkauksetAndPayments():
	ret = commitSQLCommand("drop table piikkaukset, payments;");
	createTables()
	return ret

def isValidUserId(userId, con):
	cur = con.cursor()
	sql = "select * from users where id = " + str(userId) + ";";
	ret = cur.execute(sql) > 0
	cur.close()
	return ret

def isValidItemId(itemId, con):
	cur = con.cursor()
	sql = "select * from items where id = " + str(itemId) + ";";
	ret = cur.execute(sql) > 0
	cur.close()
	return ret


def getAllUsers():
	return fetchWithSQLCommand("select * from users;")

def getAllItems():
	return fetchWithSQLCommand("select * from items;")

def getAllPiikkaukset(limit=0):
	if limit == 0:
		limitStr = ";"
	else:
		limitStr = " limit " + str(limit) + ";"

	return fetchWithSQLCommand("""select piikkaukset.userId as userId, 
			piikkaukset.itemId as itemId, 
			users.name as userName, 
			items.name as itemName, 
			piikkaukset.value as value, 
			piikkaukset.price as price, 
			DATE_FORMAT(piikkaukset.date, '%Y-%m-%d %H:%i:%S') as date, 
			piikkaukset.ip as ip,
			piikkaukset.originalUser as originalUser
			from piikkaukset left join users on piikkaukset.userId = users.id left join items on piikkaukset.itemId = items.id
			order by piikkaukset.orderId desc""" + limitStr)

def getAllPayments(limit=0):
	if limit == 0:
		limitStr = ";"
	else:
		limitStr = " limit " + str(limit) + ";"
	return fetchWithSQLCommand("""select payments.userId as userId, users.name as userName, payments.value as value, DATE_FORMAT(payments.date, '%Y-%m-%d') as date
			from payments left join users on payments.userId = users.id
			order by payments.date desc""" + limitStr)

def isValidUsernameAndPassword(username, password):
	passwordHash = util.encrypt(password);

	sql = "select password from users where name = '" + str(username) + "';"
	result = fetchWithSQLCommand(sql)

	if (result is not None) and len(result) > 0:
		realPasswordHash = result[0][0]
		if util.verify(password, realPasswordHash):
			return True #Correct password, let in

	allUsers = getAllUsers()

	if allUsers == None or len(allUsers) == 0: #No users, let admin in
		return True

	return False #Don't let in!

def isValidUserIdAndPassword(userId, password):
	passwordHash = util.encrypt(password);

	sql = "select password from users where id = " + str(userId) + ";"
	result = fetchWithSQLCommand(sql)

	if len(result) > 0:
		realPasswordHash = result[0][0]
		if util.verify(password, realPasswordHash):
			return True #Correct password, let in

	if len(getAllUsers()) == 0: #No users, let admin in
		return True

	return False #Don't let in!

def changePassword(fieldStorage):
	#fields already checked
	userId = int(fieldStorage["userId"].value)

	oldPassword = fieldStorage["oldPassword"].value
	oldPasswordHash = util.encrypt(oldPassword);

	newPassword = fieldStorage["newPassword"].value
	newPasswordHash = util.encrypt(newPassword);

	sql = "select password from users where id = " + str(userId) + ";"
	result = fetchWithSQLCommand(sql)
	if len(result) > 0:
		realPasswordHash = result[0][0]
		if util.verify(oldPassword, realPasswordHash):
			sql = "update users set password='"+newPasswordHash+"' where id = " + str(userId) + ";"
			result = commitSQLCommand(sql);
			return result > 0
	return False

