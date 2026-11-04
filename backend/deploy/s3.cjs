function privateStorageConfiguration(env){
  const bucket=env.S3_BUCKET,prefix=(env.S3_PREFIX||'vertice/photos').replace(/^\/+|\/+$/g,'');
  if(!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket||'')||!env.S3_REGION||!prefix||!/^[a-zA-Z0-9/_-]+$/.test(prefix))throw Error('Configure bucket, região e prefixo privados válidos.');
  const arn='arn:aws:s3:::'+bucket;
  return {
    iamPolicy:{Version:'2012-10-17',Statement:[{Sid:'PrivatePhotoObjects',Effect:'Allow',Action:['s3:GetObject','s3:PutObject','s3:DeleteObject'],Resource:arn+'/'+prefix+'/*',Condition:{Bool:{'aws:SecureTransport':'true'}}}]},
    publicAccessBlock:{BlockPublicAcls:true,IgnorePublicAcls:true,BlockPublicPolicy:true,RestrictPublicBuckets:true},
    ownershipControls:{Rules:[{ObjectOwnership:'BucketOwnerEnforced'}]},
    encryption:{Rules:[{ApplyServerSideEncryptionByDefault:{SSEAlgorithm:'AES256'}}]},
    bucketPolicy:{Version:'2012-10-17',Statement:[{Sid:'DenyInsecureTransport',Effect:'Deny',Principal:'*',Action:'s3:*',Resource:[arn,arn+'/*'],Condition:{Bool:{'aws:SecureTransport':'false'}}}]},
  };
}
module.exports={privateStorageConfiguration};
