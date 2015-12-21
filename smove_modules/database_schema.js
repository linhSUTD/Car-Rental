/**
 * Created by linhnh on 26/3/15.
 */
var mongoose = require('./Database.js');


var DatabaseSchema = {

    UserSchema : {
        username:       { type: String, unique: true},
        email:          { type: String, unique: true},
        password:       { type: String },
        given_name:     { type: String },
        surname:        { type: String },
        contact:        { type: String },
        role:           { type: String, enum: ['Admin', 'Public', 'Provider'], default: 'Public' },
        status:         { type: String, enum: ['active', 'suspended', 'inactive'], default: 'inactive' },
        providerId:     { type: mongoose.Schema.Types.ObjectId, default: null },
        avatar:         { type: String, unique: true }
    },

    ParkLocationSchema: {
        name:         { type: String,required:true },
        location:     { type: [Number], index: '2d' },
        active:       { type: Boolean, default: false },
        carAvailable: { type: Number, default: 0 }

    },

    CarSchema: {
        condition:  { type: String, enum: ['Excellent', 'Good', 'Normal', 'Bad'], default: 'Excellent' },
        plate:      { type: String, unique: true },
        parking:    { type: mongoose.Schema.Types.ObjectId, ref: 'parklocation' },
        gallery:    [{ type: String, unique: true }],
        provider:   { type: mongoose.Schema.Types.ObjectId, ref: 'provider' }
    },

    ProviderSchema: {
        image: { data: Buffer, contentType: String },
        //rating
        oneStar: { type: Number, default: 0 },
        twoStar: { type: Number, default: 0 },
        threeStar: { type: Number, default: 0 },
        fourStar: { type: Number, default: 0 },
        fiveStar: { type: Number , default: 0 },
        rating: { type: Number, default: 0 },
        base: { type: [Number], index: '2d'}
    },

    ActivationEntry: {
        user_id:    {type: String},
        user_key:   {type: String, unique: true},
        expired:    {type: Date}
    },

    EmailQueue: {
        create_date:  {type: Date},
        message:      {type: String},
        type:         {type: Number}
    }


}

module.exports = {

    DatabaseSchema:     DatabaseSchema,
    CarDB:              mongoose.model('car',           DatabaseSchema.CarSchema),
    ProviderDB:         mongoose.model('provider',      DatabaseSchema.ProviderSchema),
    ParkLocation:       mongoose.model('parklocation',  DatabaseSchema.ParkLocationSchema),
    UserDB:             mongoose.model('Users',         DatabaseSchema.UserSchema),
    ActivationDB:       mongoose.model('Activation',    DatabaseSchema.ActivationEntry),
    EmailQueueDB:       mongoose.model('EmailQueue',    DatabaseSchema.EmailQueue)
};
