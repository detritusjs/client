const { ClusterManager } = require('../../../../lib');


const token = '';
const manager = new ClusterManager('./child.js', token, {
  shardCount: 6,
  shardsPerCluster: 2,
});

(async () => {
  await manager.run();
  console.log('now running 3 clusters with 2 shards on each one');
})();
