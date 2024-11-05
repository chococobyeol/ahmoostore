<?php

add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/register', array(
        'methods' => 'POST',
        'callback' => 'register_user_api',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('custom/v1', '/login', array(
        'methods' => 'POST',
        'callback' => 'login_user_api',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('custom/v1', '/update-order-status', array(
        'methods' => ['POST', 'OPTIONS'],
        'callback' => 'update_order_status_callback',
        'permission_callback' => '__return_true'
    ));
});

function register_user_api($request) {
    $username = sanitize_user($request['username']);
    $email = sanitize_email($request['email']);
    $password = $request['password'];

    $error = new WP_Error();

    if (empty($username)) {
        $error->add('username_empty', '사용자 이름은 필수입니다.');
    }
    if (empty($email)) {
        $error->add('email_empty', '이메일은 필수입니다.');
    }
    if (empty($password)) {
        $error->add('password_empty', '비밀번호는 필수입니다.');
    }

    if ($error->get_error_codes()) {
        return $error;
    }

    $user_id = wp_create_user($username, $password, $email);

    if (is_wp_error($user_id)) {
        return $user_id;
    }

    $user = new WP_User($user_id);
    $user->set_role('customer');

    return array(
        'status' => 'success',
        'message' => '회원가입이 완료되었습니다.'
    );
}

function login_user_api($request) {
    $username = $request['username'];
    $password = $request['password'];

    $user = wp_authenticate($username, $password);

    if (is_wp_error($user)) {
        return new WP_Error(
            'login_failed',
            '아이디 또는 비밀번가 올바지 않습니다.',
            array('status' => 401)
        );
    }

    return array(
        'status' => 'success',
        'message' => '로그인 성공',
        'user' => array(
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'displayName' => $user->display_name
        )
    );
}

function update_order_status_callback($request) {
    $json = $request->get_json_params();
    $order_id = isset($json['order_id']) ? sanitize_text_field($json['order_id']) : '';
    
    error_log('[토스페이먼츠] 주문 상태 업데이트 시작 - Order ID: ' . $order_id);
    
    if (empty($order_id)) {
        return new WP_Error('no_order_id', '주문 ID가 필요합니다.', array('status' => 400));
    }

    try {
        // 주문 ID 정리
        $order_id = str_replace('#', '', $order_id);
        
        // 데이터베이스 직접 업데이트
        global $wpdb;
        
        // 1. post_status 업데이트
        $result1 = $wpdb->update(
            $wpdb->posts,
            array('post_status' => 'wc-processing'),
            array('ID' => $order_id),
            array('%s'),
            array('%d')
        );
        
        error_log('[토스페이먼츠] posts 테이블 업데이트 결과: ' . ($result1 !== false ? 'success' : 'fail'));

        // 2. 메타데이터 업데이트
        $meta_updates = array(
            '_payment_method' => 'tosspayments',
            '_payment_method_title' => '토스페이먼츠',
            '_paid_date' => current_time('mysql'),
            '_completed_date' => current_time('mysql'),
            '_order_status' => 'processing'
        );

        foreach ($meta_updates as $meta_key => $meta_value) {
            update_post_meta($order_id, $meta_key, $meta_value);
        }
        
        // 3. 주문 노트 추가
        $wpdb->insert(
            $wpdb->prefix . 'comments',
            array(
                'comment_post_ID' => $order_id,
                'comment_author' => 'WooCommerce',
                'comment_content' => '토스페이먼츠 결제가 완료되었습니다.',
                'comment_type' => 'order_note',
                'comment_date' => current_time('mysql'),
                'comment_date_gmt' => current_time('mysql', 1)
            )
        );

        error_log('[토스페이먼츠] 주문 처리 완료 - Order ID: ' . $order_id);
        
        // 캐시 삭제
        clean_post_cache($order_id);
        wp_cache_delete($order_id, 'posts');
        
        return array(
            'success' => true,
            'message' => '주문 상태가 업데이트되었습니다.',
            'order_id' => $order_id
        );
        
    } catch (Exception $e) {
        error_log('[토스페이먼츠] 오류 발생: ' . $e->getMessage());
        return new WP_Error(
            'update_failed',
            '주문 상태 업데이트 실패: ' . $e->getMessage(),
            array('status' => 500)
        );
    }
}

add_action('init', function() {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type");
        header("Access-Control-Allow-Credentials: true");
    }
    
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        status_header(200);
        exit();
    }
});

add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        if (isset($_SERVER['HTTP_ORIGIN'])) {
            header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
            header('Access-Control-Allow-Credentials: true');
        }
        return $value;
    });
});

add_filter('woocommerce_rest_check_permissions', function($permission, $context, $object_id, $post_type){
    return true;
}, 10, 4);

add_filter('woocommerce_rest_pre_insert_shop_order_object', function($order, $request) {
    error_log('WooCommerce 주문 생성 요청 데이터: ' . print_r($request->get_params(), true));
    return $order;
}, 10, 2);

add_filter('rest_pre_dispatch', function($result, $server, $request) {
    if (strpos($request->get_route(), '/wc/v3/orders') !== false) {
        error_log('WooCommerce API 요청 경로: ' . $request->get_route());
        error_log('WooCommerce API 요청 메소드: ' . $request->get_method());
        error_log('WooCommerce API 요청 헤더: ' . print_r($request->get_headers(), true));
        error_log('WooCommerce API 요청 파라미터: ' . print_r($request->get_params(), true));
    }
    return $result;
}, 10, 3);

add_filter('woocommerce_rest_check_permissions', function($permission, $context, $object_id, $post_type) {
    if ($post_type === 'shop_order') {
        error_log('WooCommerce 주문 권한 체크: ' . $context);
        return true;
    }
    return $permission;
}, 10, 4);

add_filter('woocommerce_rest_pre_dispatch', function($result, $server, $request) {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        header("Access-Control-Allow-Credentials: true");
    }
    return $result;
}, 10, 3);

add_action('woocommerce_order_status_changed', function($order_id, $old_status, $new_status) {
    error_log(sprintf(
        '주문 상태 변경 - Order ID: %s, Old Status: %s, New Status: %s',
        $order_id,
        $old_status,
        $new_status
    ));
}, 10, 3);