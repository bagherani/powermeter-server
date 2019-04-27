const db = require('../controllers/database');
const assert = require('assert');

describe('db test', () => {
    var id = 0;
    var collectionName = 'testCollection';

    beforeAll(async () => {
        id = Math.random();

        await db.connect()
            .then(res => { })
            .catch(err => {
                assert(err == null, `error connecting to mongodb: ${err}`);
            });
    });

    it('can insert', async () => {
        await db.insert(collectionName, { uniqueID: id, title: 'someTitle' })
            .then(async res => { })
            .catch(err => {
                assert(err == null, `error inserting to testCollection: ${err}`);
            })
    });

    it('can read', async () => {
        await db.find(collectionName).then(async (rows) => {
            var r = await rows.toArray();
            assert(r.findIndex(item => item.uniqueID == id) > -1, `${id} is not inserted!`)
        }).catch(err => {
            assert(err == null, `error getting from testCollection: ${err}`);
        })
    });

    it('can delete', async () => {
        // todo: bug here
        await db.delete(collectionName, 9999999999999).then().catch(err => {
            assert(err == null, `error deleting records of testCollection: ${err}`);
        })
    });


});

