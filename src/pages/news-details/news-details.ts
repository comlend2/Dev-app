import { Component, ViewChild, ElementRef, NgZone } from '@angular/core';
import { NavController, NavParams, Content, App, Events, ActionSheetController } from 'ionic-angular';
import { FirebaseProvider } from '../../providers/firebase/firebase';
import { GlobalsProvider } from '../../providers/globals/globals';
import { Camera, CameraOptions } from '@ionic-native/camera';
import * as _ from 'lodash';

/**
 * Generated class for the NewsDetailsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */


@Component({
	selector: 'page-news-details',
	templateUrl: 'news-details.html',
})
export class NewsDetailsPage {
	@ViewChild('commentInput') myInput: ElementRef;
	@ViewChild('content') content: Content;
	newsDetails: any;
	messageRow: number = 1;
	comment: any;
	allComments: any;
	noComments: boolean = false;
	userId: any;
	hasNoComment: boolean = true;
	commentPicUrl: any = 'Default';
	hasCommentPhoto: boolean = false;
	commentRow: number = 1;

	constructor(public navCtrl: NavController, public navParams: NavParams, public app: App, public firebase: FirebaseProvider, public globals: GlobalsProvider, public actionSheetCtrl: ActionSheetController, public camera: Camera, public events: Events, public zone: NgZone) {
		this.newsDetails = this.navParams.get('news');

		this.events.subscribe('newsupdated', () => {
			this.zone.run(() => {
				for (let index = 0; index < this.globals.news.length; index++) {
					var eachGlobalNews = this.globals.news[index];
					if (this.newsDetails.id == eachGlobalNews.id) {
						console.log('updated news data', eachGlobalNews);
						this.newsDetails = eachGlobalNews;
					}

				}
			});
		});

		console.log(this.newsDetails);
		this.getAllComments();
		this.userId = this.globals.userId;
	}

	ionViewDidLoad() {
		console.log('ionViewDidLoad NewsDetailsPage');
	}
	back() {
		this.app.getRootNav().pop();
	}
	hasComment() {
		if (this.comment != null) {
			this.hasNoComment = false;
		}
		else if (this.comment = null) {
			this.hasNoComment = true;
		}
	}
	addComment() {
		this.firebase.addCommentToNews(this.newsDetails, this.globals.userData, this.comment, this.commentPicUrl).then((data) => {
			console.log('comment added');
			this.getAllComments();
			this.comment = '';
			this.noComments = false;
			this.hasCommentPhoto = false;
			this.commentPicUrl = 'Default';
			this.myInput.nativeElement.style.height = '20px';
			// this.navCtrl.pop();

			// Send Push Notification
			if (this.newsDetails.deviceToken) {
				var newsPublisherDeviceToken = this.newsDetails;
				this.firebase.sendNewsCommentNoti(newsPublisherDeviceToken).then(() => {
					// Notification Sent
				}).catch((err) => {
					console.log('Comment Notification Err => ', err);
				});				
			}
		});
	}

	addLike() {
		this.firebase.addLikeToNews(this.globals.userData, this.newsDetails).then((data) => {
			console.log('like added');
			// this.navCtrl.pop();

		});
	}
	removeLike() {
		console.log('Remove Like ');
		this.newsDetails.postLiked = false;
		var userId = this.globals.userId;
		var like = _.find(this.newsDetails.likes, { 'uId': userId });
		console.log('Remove Like ', like.id);
		this.firebase.removeLikesFromNews(this.newsDetails, like).then();
	}


	getAllComments() {
		this.firebase.getAllComments(this.newsDetails.id).then((data) => {
			this.allComments = data;

		}, (error) => {
			console.log(error);
			this.noComments = true;
		});
	}

	uploadPic() {
		let actionSheet = this.actionSheetCtrl.create({
			buttons: [
				{
					text: 'Take Photo',
					handler: () => {
						this.selectImage(0);
					}
				},
				{
					text: 'Choose from Library',
					handler: () => {
						this.selectImage(1);
					}
				},
				{
					text: 'Cancel',
					role: 'cancel'
				}
			]
		});
		actionSheet.present();
	}

	selectImage(type) {
		let options: CameraOptions = {
			quality: 90,
			targetWidth: 300,
			targetHeight: 300,
			allowEdit: true,
			destinationType: this.camera.DestinationType.DATA_URL,
			encodingType: this.camera.EncodingType.JPEG,
			mediaType: this.camera.MediaType.PICTURE,
			sourceType: (type == 0) ? this.camera.PictureSourceType.CAMERA : this.camera.PictureSourceType.PHOTOLIBRARY
		};

		this.camera.getPicture(options).then((imageData) => {
			var imageData = imageData;
			// this.commentPicUrl = imageData;

			this.firebase.uploadPicture(imageData).then((data) => {
				this.commentPicUrl = data;
				console.log('Camera Data ', data);
				this.hasCommentPhoto = true;

			})
				.catch((err) => {
					console.log('Camera Error ', err);
				});
		});
	}

	resize() {
		console.log(this.myInput.nativeElement.style.height);
		// if (this.myInput.nativeElement.style.height) {
		this.myInput.nativeElement.style.height = this.myInput.nativeElement.scrollHeight + 'px';
		// this.messageRow = this.messageRow + 1;
		// }

	}


}
