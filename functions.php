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
    
    error_log('주문 상태 업데이트 시작 - 받은 데이터: ' . print_r($json, true));
    
    if (empty($order_id)) {
        error_log('주문 상태 업데이트 실패: 주문 ID 없음');
        return new WP_Error('no_order_id', '주문 ID가 필요합니다.', array('status' => 400));
    }

    try {
        if (!class_exists('WooCommerce')) {
            error_log('WooCommerce가 활성화되어 있지 않습니다.');
            throw new Exception('WooCommerce가 활성화되어 있지 않습니다.');
        }

        error_log('주문 객체 조회 시도 - Order ID: ' . $order_id);
        
        $order_id = str_replace('#', '', $order_id);
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            error_log('주문을 찾을 수 없음 - Order ID: ' . $order_id);
            return new WP_Error('invalid_order', '유효하지 않은 주문입니다.', array('status' => 404));
        }

        error_log('현재 주문 상태: ' . $order->get_status());

        $order->payment_complete();
        
        $order->update_meta_data('_payment_method', 'tosspayments');
        $order->update_meta_data('_payment_method_title', '토스페이먼츠');
        $order->update_meta_data('_paid_date', current_time('mysql'));
        
        $order->add_order_note('토스페이먼츠 결제가 완료되었습니다.');
        
        wc_reduce_stock_levels($order_id);
        
        $order->update_status('processing', '결제 완료 처리됨');
        
        $order->save();
        
        error_log('주문 처리 완료 - 최종 상태: ' . $order->get_status());
        
        return array(
            'success' => true,
            'message' => '주문 상태가 업데이트되었습니다.',
            'order_id' => $order_id,
            'new_status' => $order->get_status()
        );
        
    } catch (Exception $e) {
        error_log('주문 상태 업데이트 중 오류 발생: ' . $e->getMessage());
        return new WP_Error(
            'update_failed',
            '주문 상태 업데이트 실패: ' . $e->getMessage(),
            array('status' => 500)
        );
    }
}

add_action('init', function() {
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        if (isset($_SERVER['HTTP_ORIGIN'])) {
            header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
            header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Max-Age: 86400');    // 캐시 24시간
        }
        exit(0);
    }

    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
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